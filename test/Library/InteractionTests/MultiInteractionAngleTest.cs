using System;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;

namespace InteractionTests;

public class MultiInteractionAngleTest
{
    private sealed class Detector : MultiInteractionObserver
    {
        public async Task<Interaction[]> Detect() => (await Analyze(new ProcessPerformance())).Item1.ToArray();
    }

    /// <summary>
    /// The vector sums have prescribed cosine similarities on each axis. Their mean is .6;
    /// both axis orientations must pass a .7 threshold. The missing parentheses reject both.
    /// Only the center is a valid candidate, isolating the angle calculation from classification.
    /// </summary>
    [TestCase(.8f, .4f)]
    [TestCase(.4f, .8f)]
    public async Task DetectionUsesEqualWeightsForBothAxes(float xCosine, float yCosine)
    {
        var field = new VectorField2(5, 5);
        foreach (var vector in field.AsArray()) vector.IsValid = false;
        field[2, 2].Set(new Vector2(1, 0));
        field[2, 2].IsValid = true;
        field[1, 2].Set(new Vector2(xCosine - 1, MathF.Sqrt(1 - xCosine * xCosine)));
        field[2, 1].Set(new Vector2(yCosine - 1, MathF.Sqrt(1 - yCosine * yCosine)));
        var detector = new Detector
        {
            PointCloud = new PointCloud3(5, 5), VectorField = field, MinAngle = .7f
        };
        var contacts = await detector.Detect();
        Assert.That(contacts, Has.Length.EqualTo(1));
        Assert.That(contacts[0].Position.X, Is.EqualTo(2));
        Assert.That(contacts[0].Position.Y, Is.EqualTo(2));
    }
}
