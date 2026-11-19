using System;
using NUnit.Framework;
using Newtonsoft.Json;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Server.Data;

namespace InteractionTests;

public class AssignmentSettingsTest
{
    [TestCase("{}", true, .5f, .5f)]
    [TestCase("{\"UseMinimumCostAssignment\":false,\"AssignmentMissCost\":0,\"AssignmentBirthCost\":0}", false, 0, 0)]
    [TestCase("{\"UseMinimumCostAssignment\":false,\"AssignmentMissCost\":0.25,\"AssignmentBirthCost\":1.25}", false, .25f, 1.25f)]
    public void LegacyDefaultsAndExplicitValuesSurviveBothJsonSerializers(string json, bool enabled, float miss, float birth)
    {
        var fromFile = JsonConvert.DeserializeObject<TrackingServerAppSettings>(json);
        var fromApi = System.Text.Json.JsonSerializer.Deserialize<TrackingServerAppSettings>(json);
        foreach (var settings in new[] { fromFile, fromApi,
                     JsonConvert.DeserializeObject<TrackingServerAppSettings>(JsonConvert.SerializeObject(fromFile)),
                     System.Text.Json.JsonSerializer.Deserialize<TrackingServerAppSettings>(
                         System.Text.Json.JsonSerializer.Serialize(fromApi)) })
        {
            Assert.Multiple(() =>
            {
                Assert.That(settings.UseMinimumCostAssignment, Is.EqualTo(enabled));
                Assert.That(settings.AssignmentMissCost, Is.EqualTo(miss));
                Assert.That(settings.AssignmentBirthCost, Is.EqualTo(birth));
            });
        }
    }

    [Test]
    public void TrackerAndServerShareAssignmentDefaults()
    {
        var settings = new TrackingServerAppSettings();
        var tracker = new InteractionSmoothingBehaviour(15);
        Assert.Multiple(() =>
        {
            Assert.That(settings.UseMinimumCostAssignment, Is.EqualTo(tracker.UseMinimumCostAssignment).And.True);
            Assert.That(settings.AssignmentMissCost, Is.EqualTo(tracker.AssignmentMissCost));
            Assert.That(settings.AssignmentBirthCost, Is.EqualTo(tracker.AssignmentBirthCost));
        });
    }

    [TestCase(-1f)]
    [TestCase(float.NaN)]
    [TestCase(float.PositiveInfinity)]
    [TestCase(float.NegativeInfinity)]
    public void ServerSettingsRejectInvalidCosts(float value)
    {
        var settings = new TrackingServerAppSettings();
        Assert.Multiple(() =>
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => settings.AssignmentMissCost = value);
            Assert.Throws<ArgumentOutOfRangeException>(() => settings.AssignmentBirthCost = value);
            Assert.That(settings.AssignmentMissCost, Is.EqualTo(.5f));
            Assert.That(settings.AssignmentBirthCost, Is.EqualTo(.5f));
        });
    }
}
