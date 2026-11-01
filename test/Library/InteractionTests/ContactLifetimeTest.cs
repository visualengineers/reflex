using System;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;
using ReFlex.Server.Data.Config;
using System.Text.Json;

namespace InteractionTests;

/// <summary>
/// All times are explicit monotonic seconds. A contact measured at t=10 with retention .25
/// remains eligible through t=10.25, and expires strictly afterwards, before association.
/// Vary the intermediate observation times to add cadence scenarios; never use sleeps.
/// </summary>
public class ContactLifetimeTest
{
    private static InteractionFrame Step(InteractionSmoothingBehaviour tracker, double time, bool measured = false) =>
        tracker.Update(measured ? new[] { new Interaction(new Point3(10, 10, -.5f), InteractionType.Push, 10) }
            : Array.Empty<Interaction>(), time);

    [TestCase(0)]
    [TestCase(1)]
    [TestCase(20)]
    public void ExpiryDependsOnElapsedTimeNotNumberOfEmptyUpdates(int emptyUpdates)
    {
        var tracker = new InteractionSmoothingBehaviour(2) { ContactRetentionSeconds = .25 };
        var id = Step(tracker, 10, true).Interactions.Single().TouchId;
        for (var i = 1; i <= emptyUpdates; i++)
            Assert.That(Step(tracker, 10 + .24 * i / emptyUpdates).Interactions.Single().TouchId, Is.EqualTo(id));
        var boundary = Step(tracker, 10.25).Interactions.Single();
        Assert.That(boundary.TouchId, Is.EqualTo(id));
        Assert.That(boundary.TrackingState, Is.EqualTo(InteractionTrackingState.Lost));
        Assert.That(Step(tracker, 10.2501).Interactions, Is.Empty);
        Assert.That(Step(tracker, 10.26, true).Interactions.Single().TouchId, Is.Not.EqualTo(id));
    }

    [TestCase(.249, true)]
    [TestCase(.25, true)]
    [TestCase(.251, false)]
    public void ReturningMeasurementIsCheckedAgainstDeadlineEvenWithoutIntermediateFrames(double gap, bool retainsId)
    {
        var tracker = new InteractionSmoothingBehaviour(20) { ContactRetentionSeconds = .25 };
        var id = Step(tracker, 0, true).Interactions.Single().TouchId;
        Assert.That(Step(tracker, gap, true).Interactions.Single().TouchId == id, Is.EqualTo(retainsId));
    }

    [Test]
    public void DecimalDeadlineAtLargeClockOriginIsInclusive()
    {
        var tracker = new InteractionSmoothingBehaviour(2) { ContactRetentionSeconds = .1 };
        var id = Step(tracker, 1000.1, true).Interactions.Single().TouchId;
        Assert.That(Step(tracker, 1000.2, true).Interactions.Single().TouchId, Is.EqualTo(id));
    }

    [Test]
    public void MeasurementsRenewDeadlineButLostUpdatesDoNot()
    {
        var tracker = new InteractionSmoothingBehaviour(2) { ContactRetentionSeconds = .25 };
        var id = Step(tracker, 0, true).Interactions.Single().TouchId;
        Assert.That(Step(tracker, .2, true).Interactions.Single().TouchId, Is.EqualTo(id));
        Step(tracker, .3);
        Assert.That(Step(tracker, .44).Interactions.Single().TouchId, Is.EqualTo(id));
        Assert.That(Step(tracker, .46).Interactions, Is.Empty);
    }

    [Test]
    public void ZeroRetentionDisablesBridgingAndHistoryZeroStillDisablesTracking()
    {
        var tracker = new InteractionSmoothingBehaviour(2) { ContactRetentionSeconds = 0 };
        var id = Step(tracker, 0, true).Interactions.Single().TouchId;
        Assert.That(Step(tracker, .01, true).Interactions.Single().TouchId, Is.Not.EqualTo(id));
        Assert.That(Step(tracker, .02).Interactions, Is.Empty);
        tracker.ContactRetentionSeconds = 10;
        tracker.NumFramesHistory = 0;
        Step(tracker, .03, true);
        Assert.That(Step(tracker, .04).Interactions, Is.Empty);
    }

    [TestCase("{\"MaxNumEmptyFramesBetween\":3}", .1)]
    [TestCase("{\"MaxNumEmptyFramesBetween\":0}", 0)]
    [TestCase("{\"MaxNumEmptyFramesBetween\":3,\"ContactRetentionSeconds\":0.25}", .25)]
    [TestCase("{\"ContactRetentionSeconds\":0.25,\"MaxNumEmptyFramesBetween\":3}", .25)]
    [TestCase("{}", .1)]
    public void LegacyConfigurationMigratesAtThirtyHzAndExplicitSecondsWin(string json, double expected)
    {
        var migrated = Newtonsoft.Json.JsonConvert.DeserializeObject<SmoothingParameter>(json);
        Assert.That(migrated.ContactRetentionSeconds, Is.EqualTo(expected));
        Assert.That(Newtonsoft.Json.JsonConvert.SerializeObject(migrated), Does.Not.Contain("MaxNumEmptyFramesBetween"));
        var settings = JsonSerializer.Deserialize<SmoothingParameter>(json);
        Assert.That(settings.ContactRetentionSeconds, Is.EqualTo(expected));
        Assert.That(settings.ConfidenceGainPerSecond, Is.EqualTo(30));
        Assert.That(settings.ConfidenceDecayPerSecond, Is.EqualTo(30));
        var saved = JsonSerializer.Serialize(settings);
        Assert.That(saved, Does.Not.Contain("MaxNumEmptyFramesBetween"));
        Assert.That(JsonSerializer.Deserialize<SmoothingParameter>(saved).ContactRetentionSeconds, Is.EqualTo(expected));
    }
}
