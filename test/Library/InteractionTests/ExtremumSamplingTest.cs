using Math = System.Math;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;

namespace InteractionTests;

public class ExtremumSamplingTest
{
    private sealed class Classifier : MultiInteractionObserver
    {
        public ExtremumDescription Classify(int x = 20, int y = 20) =>
            ComputeExtremumType(PointCloud.AsJaggedArray(), x, y);
    }

    private static Classifier Create(ExtremumTypeCheckMethod method, int samples = 8, int radius = 8)
    {
        var cloud = new PointCloud3(41, 41);
        for (var x = 0; x < cloud.SizeX; x++)
        for (var y = 0; y < cloud.SizeY; y++)
        {
            cloud[x, y].X = x;
            cloud[x, y].Y = y;
            cloud[x, y].Z = 2;
        }

        return new Classifier
        {
            PointCloud = cloud,
            ExtremumTypeCheckRadius = radius,
            ExtremumTypeCheckNumSamples = samples,
            ExtremumTypeCheckMethod = method,
            ExtremumTypeCheckFittingPercentage = .75f
        };
    }

    [TestCase(ExtremumTypeCheckMethod.FixedRadius, 1, ExtremumType.Minimum)]
    [TestCase(ExtremumTypeCheckMethod.FixedRadius, 3, ExtremumType.Maximum)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 1, ExtremumType.Minimum)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 3, ExtremumType.Maximum)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 1, ExtremumType.Minimum)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 3, ExtremumType.Maximum)]
    public void ClassifiesIsolatedExtrema(ExtremumTypeCheckMethod method, float depth, ExtremumType expected)
    {
        var observer = Create(method);
        observer.PointCloud[20, 20].Z = depth;

        var result = observer.Classify();

        Assert.That(result.Type, Is.EqualTo(expected));
        Assert.That(result.NumFittingPoints, Is.EqualTo(8));
        Assert.That(result.PercentageFittingPoints, Is.EqualTo(1));
    }

    [TestCase(0)]
    [TestCase(1)]
    [TestCase(2)]
    [TestCase(3)]
    [TestCase(4)]
    [TestCase(5)]
    [TestCase(6)]
    [TestCase(7)]
    public void FixedSamplesCoverEverySectorOfTheCircle(int sector)
    {
        // Radius deliberately differs from sample count: every 45-degree sector
        // must contribute exactly one sample to the classification.
        var observer = Create(ExtremumTypeCheckMethod.FixedRadius, radius: 12);
        foreach (var point in observer.PointCloud.AsArray())
        {
            var angle = Math.Atan2(point.Y - 20, point.X - 20);
            var pointSector = ((int)Math.Floor((angle + Math.PI / 8 + 2 * Math.PI) / (Math.PI / 4))) % 8;
            point.Z = pointSector == sector ? 3 : 1;
        }
        observer.PointCloud[20, 20].Z = 2;

        var result = observer.Classify();

        Assert.That(result.Type, Is.EqualTo(ExtremumType.Maximum));
        Assert.That(result.NumFittingPoints, Is.EqualTo(7));
        Assert.That(result.PercentageFittingPoints, Is.EqualTo(.875f));
    }

    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, true)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, false)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, true)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, false)]
    public void StochasticSamplesCoverBothSidesOfEachAxis(ExtremumTypeCheckMethod method, bool xAxis)
    {
        // A broad interval and many samples keep this statistical regression
        // check insensitive to the random sequence (failure probability < 1e-50).
        var observer = Create(method, samples: 4096);
        observer.ExtremumTypeCheckFittingPercentage = .9f;
        foreach (var point in observer.PointCloud.AsArray())
            point.Z = (xAxis ? point.X : point.Y) < 20 ? 1 : 3;
        observer.PointCloud[20, 20].Z = 2;

        var result = observer.Classify();

        Assert.That(result.Type, Is.EqualTo(ExtremumType.Undefined));
        Assert.That(result.PercentageFittingPoints, Is.InRange(.5f, .75f));
        Assert.That(result.NumFittingPoints, Is.InRange(2048, 3072));
    }

    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 2)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 3)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 8)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 9)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 2)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 3)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 8)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 9)]
    public void StochasticOffsetsKeepTheConfiguredMagnitudeRange(ExtremumTypeCheckMethod method, int radius)
    {
        var observer = Create(method, samples: 4096, radius: radius);
        var min = radius / 2;
        foreach (var point in observer.PointCloud.AsArray())
        {
            var dx = Math.Abs(point.X - 20);
            var dy = Math.Abs(point.Y - 20);
            point.Z = dx >= min && dx < radius && dy >= min && dy < radius ? 3 : 1;
        }
        observer.PointCloud[20, 20].Z = 2;

        var result = observer.Classify();

        Assert.That(result.Type, Is.EqualTo(ExtremumType.Minimum));
        Assert.That(result.NumFittingPoints, Is.EqualTo(4096));
        Assert.That(result.PercentageFittingPoints, Is.EqualTo(1));
    }

    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 0)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 1)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 0)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 1)]
    public void SmallStochasticRadiiSampleTheCenter(ExtremumTypeCheckMethod method, int radius)
    {
        var observer = Create(method, radius: radius);
        observer.PointCloud[20, 20].Z = 1;

        var result = observer.Classify();

        // Equal depths retain the existing classification as closer samples.
        Assert.That(result.Type, Is.EqualTo(ExtremumType.Maximum));
        Assert.That(result.NumFittingPoints, Is.EqualTo(8));
        Assert.That(result.PercentageFittingPoints, Is.EqualTo(1));
    }

    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 0)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 1)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 2)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic, 3)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 0)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 1)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 2)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic, 3)]
    public void StochasticSamplesCoverAllFourQuadrants(ExtremumTypeCheckMethod method, int quadrant)
    {
        var observer = Create(method, samples: 4096);
        observer.ExtremumTypeCheckFittingPercentage = .9f;
        foreach (var point in observer.PointCloud.AsArray())
        {
            var pointQuadrant = (point.X < 20 ? 1 : 0) + (point.Y < 20 ? 2 : 0);
            point.Z = pointQuadrant == quadrant ? 3 : 1;
        }
        observer.PointCloud[20, 20].Z = 2;

        var result = observer.Classify();

        Assert.That(result.Type, Is.EqualTo(ExtremumType.Undefined));
        // Approximately one quarter of samples is farther away. This also catches
        // correlated signs that axis-only checks would miss; broad statistical bounds.
        Assert.That(result.PercentageFittingPoints, Is.InRange(.65f, .85f));
    }

    [TestCase(.75f, ExtremumType.Undefined)]
    [TestCase(.74f, ExtremumType.Maximum)]
    public void FittingRatioMustExceedThreshold(float threshold, ExtremumType expected)
    {
        var observer = Create(ExtremumTypeCheckMethod.FixedRadius, samples: 4);
        foreach (var point in observer.PointCloud.AsArray())
            point.Z = point.X < 20 && point.Y >= 20 ? 3 : 1;
        observer.PointCloud[20, 20].Z = 2;
        observer.ExtremumTypeCheckFittingPercentage = threshold;

        var result = observer.Classify();

        Assert.That(result.Type, Is.EqualTo(expected));
        Assert.That(result.NumFittingPoints, Is.EqualTo(3));
        Assert.That(result.PercentageFittingPoints, Is.EqualTo(.75f));
    }

    [TestCase(ExtremumTypeCheckMethod.FixedRadius)]
    [TestCase(ExtremumTypeCheckMethod.StochasticStatic)]
    [TestCase(ExtremumTypeCheckMethod.StochasticDynamic)]
    public void NoSamplesLeaveExtremumUndefined(ExtremumTypeCheckMethod method)
    {
        var result = Create(method, samples: 0).Classify();

        Assert.That(result.Type, Is.EqualTo(ExtremumType.Undefined));
        Assert.That(result.NumFittingPoints, Is.Zero);
        Assert.That(result.PercentageFittingPoints, Is.Zero);
    }

    [TestCase(0, 0)]
    [TestCase(0, 40)]
    [TestCase(40, 0)]
    [TestCase(40, 40)]
    public void SamplesAtCloudCornersAreClamped(int x, int y)
    {
        var observer = Create(ExtremumTypeCheckMethod.FixedRadius, samples: 4);
        observer.ExtremumTypeCheckFittingPercentage = .4f;
        observer.PointCloud[x, y].Z = 3;

        var result = observer.Classify(x, y);

        Assert.That(result.Type, Is.EqualTo(ExtremumType.Maximum));
        Assert.That(result.NumFittingPoints, Is.EqualTo(4));
        Assert.That(result.PercentageFittingPoints, Is.EqualTo(1));
    }
}
