using System;
using Math = System.Math;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Filtering.Components;

namespace InteractionTests;

/// <summary>
/// Scalar reference signals are mapped to three distinct axes. Every assertion checks all axes,
/// output length and finiteness. Expected averages/fits are written explicitly or derived from
/// an analytic response, independently of production filter coefficients. See SIGNAL_FILTER_TESTS.md.
/// </summary>
public class SignalFilterTest
{
    private static Point3 Point(double value) => new((float)value, (float)(2 * value + 3), (float)(.7 - .25 * value));
    private static List<Point3> Signal(params double[] values) => values.Select(Point).ToList();
    private static IPointFilter Filter(string name) => name switch
    {
        "mean" => new SimpleMovingAverageFilter(3),
        "weighted-mean" => new WeightedMovingAverageFilter(3),
        "polynomial" => new PolynomialFitFilter(1),
        "weighted-polynomial" => new WeightedPolynomialFitFilter(1),
        "savitzky-golay" => new SavitzkyGolayFilter(1, 1),
        "butterworth" => new ButterworthFilter(),
        _ => throw new ArgumentException(name)
    };
    private static readonly string[] Filters = { "mean", "weighted-mean", "polynomial", "weighted-polynomial", "savitzky-golay", "butterworth" };

    private static void AssertSignal(IReadOnlyList<Point3> actual, double[] expected, double tolerance = 1e-5)
    {
        Assert.That(actual.Count, Is.EqualTo(expected.Length));
        for (var i = 0; i < expected.Length; i++)
        {
            Assert.That(actual[i].X, Is.EqualTo(expected[i]).Within(tolerance), $"X[{i}]");
            Assert.That(actual[i].Y, Is.EqualTo(2 * expected[i] + 3).Within(2 * tolerance), $"Y[{i}]");
            Assert.That(actual[i].Z, Is.EqualTo(.7 - .25 * expected[i]).Within(tolerance), $"Z[{i}]");
        }
    }

    [TestCaseSource(nameof(Filters))]
    public void ConstantSignalHasUnitGainIncludingBothEdges(string name)
    {
        var values = Enumerable.Repeat(7d, 20).ToArray();
        AssertSignal(Filter(name).Process(Signal(values)), values);
    }

    [TestCaseSource(nameof(Filters))]
    public void EmptyAndWarmupOutputsAreIndependentCopies(string name)
    {
        var filter = Filter(name);
        Assert.That(filter.Process(new List<Point3>()), Is.Empty);
        var input = Signal(4);
        var output = filter.Process(input);
        AssertSignal(output, new[] { 4d });
        output[0].X = -100;
        Assert.That(input[0].X, Is.EqualTo(4));
        Assert.That(filter.Process(null), Is.Null, "Legacy untimed null contract is preserved.");
    }

    [TestCaseSource(nameof(Filters))]
    public void ActiveFilteringDoesNotMutateOrAliasInput(string name)
    {
        var input = Signal(0, 0, 0, 1, 1, 1);
        var filter = Filter(name);
        var output = filter.Process(input);
        AssertSignal(input, new[] { 0d, 0, 0, 1, 1, 1 });
        for (var i = 0; i < input.Count; i++)
            Assert.That(output[i], Is.Not.SameAs(input[i]));
        output[0].X = 999;
        Assert.That(input[0].X, Is.Zero);
    }

    [TestCase("mean")]
    [TestCase("weighted-mean")]
    public void MovingAverageRampAndStepUseNewestWindowAndNormalizeWarmup(string name)
    {
        var ramp = name == "mean" ? new[] { 0d, .5, 1, 2, 3 } : new[] { 0d, 2d/3, 4d/3, 7d/3, 10d/3 };
        var step = name == "mean" ? new[] { 0d, 0, 0, 1d/3, 2d/3, 1 } : new[] { 0d, 0, 0, .5, 5d/6, 1 };
        AssertSignal(Filter(name).Process(Signal(0, 1, 2, 3, 4)), ramp);
        AssertSignal(Filter(name).Process(Signal(0, 0, 0, 1, 1, 1)), step);
    }

    [TestCase("mean")]
    [TestCase("weighted-mean")]
    public void LargeFiniteConstantsDoNotOverflowBeforeNormalization(string name)
    {
        var input = Enumerable.Range(0, 10).Select(_ => new Point3(float.MaxValue / 2, -float.MaxValue / 2, 1)).ToList();
        var output = Filter(name).Process(input);
        Assert.That(output.All(p => float.IsFinite(p.X) && float.IsFinite(p.Y) && p.X == input[0].X && p.Y == input[0].Y), Is.True);
    }

    [TestCase(false)]
    [TestCase(true)]
    public void PolynomialFitReproducesRampsAtIrregularActualTimes(bool weighted)
    {
        Base2DFilter filter = weighted ? new WeightedPolynomialFitFilter(1) : new PolynomialFitFilter(1);
        var times = new[] { 1000d, 1000.01, 1000.08, 1000.1, 1000.25 };
        var values = times.Select(t => 2 + 3 * (t - 1000)).ToArray();
        AssertSignal(filter.Process(Signal(values), times), values);
    }

    [Test]
    public void WeightedFitReallyWeightsRecentTimeAndIsDeterministic()
    {
        // Degree zero is a weighted mean. Times 0,.1,.2 give weights 1,1.5,2:
        // sum(w*x)/sum(w) = 2/4.5 = 4/9, rather than the unweighted 1/3.
        var times = new[] { 0d, .1, .2 };
        var input = Signal(0, 0, 1);
        var filter = new WeightedPolynomialFitFilter(0);
        for (var run = 0; run < 3; run++)
            AssertSignal(filter.Process(input, times), Enumerable.Repeat(4d/9, 3).ToArray());
        AssertSignal(new PolynomialFitFilter(0).Process(input, times), Enumerable.Repeat(1d/3, 3).ToArray());
        // At irregular times the middle weight is 1.25, not 1.5.
        AssertSignal(filter.Process(input, new[] { 0d, .05, .2 }), Enumerable.Repeat(2d/4.25, 3).ToArray());
    }

    [Test]
    public void LinearPolynomialStepHasKnownLeastSquaresSolution()
    {
        AssertSignal(new PolynomialFitFilter(1).Process(Signal(0, 0, 0, 1, 1)), new[] { -.2, .1, .4, .7, 1 });
    }

    [Test]
    public void SavitzkyGolayPreservesRampAndQuadraticIncludingEdges()
    {
        var ramp = Enumerable.Range(0, 9).Select(i => (double)i).ToArray();
        var quadratic = ramp.Select(x => x*x).ToArray();
        AssertSignal(new SavitzkyGolayFilter(2, 2).Process(Signal(ramp)), ramp);
        AssertSignal(new SavitzkyGolayFilter(2, 2).Process(Signal(quadratic)), quadratic);
        AssertSignal(new SavitzkyGolayFilter(0, 0).Process(Signal(ramp)), ramp);
    }

    [Test]
    public void SavitzkyGolayStepHasDefinedInteriorAndBoundaryFits()
    {
        AssertSignal(new SavitzkyGolayFilter(1, 1).Process(Signal(0, 0, 0, 1, 1, 1)), new[] { 0d, 0, 1d/3, 2d/3, 1, 1 });
        AssertSignal(new SavitzkyGolayFilter(1, 1).Process(Signal(0, 0, 0, 0, 1)), new[] { 0d, 0, 0, 1d/3, 5d/6 });
    }

    [Test]
    public void ButterworthRampMatchesAnalyticResponseAtIrregularTimes()
    {
        var times = new[] { 0d, .01, .04, .1, .25, 1 };
        var alpha = 2 * Math.PI * 3 / Math.Sqrt(2);
        // Unit ramp with y(0)=y'(0)=0: y(t)=t-(1-exp(-alpha*t)*cos(alpha*t))/alpha.
        var expected = times.Select(t => t - (1 - Math.Exp(-alpha*t) * Math.Cos(alpha*t)) / alpha).ToArray();
        AssertSignal(new ButterworthFilter().Process(Signal(times), times), expected);
        var streaming = new ButterworthFilter();
        AssertSignal(times.Select(t => streaming.ProcessSample(Point(t), t)).ToList(), expected);
    }

    [Test]
    public void ButterworthStepAgreesWithAnalyticResponseAndSettlesToOne()
    {
        const double epsilon = .00001;
        var times = new[] { 0d, epsilon, .02, .05, .1, .2, .4, 1 };
        var values = times.Select(t => t == 0 ? 0d : 1d).ToArray();
        var alpha = 2 * Math.PI * 3 / Math.Sqrt(2);
        // A rise over epsilon approximates an ideal unit step; the error is bounded by 2e-4.
        var expected = times.Select(t => 1 - Math.Exp(-alpha*t) * (Math.Cos(alpha*t) + Math.Sin(alpha*t))).ToArray();
        var batch = new ButterworthFilter().Process(Signal(values), times);
        var streaming = new ButterworthFilter();
        var streamed = times.Select((t, i) => streaming.ProcessSample(Point(values[i]), t)).ToList();
        AssertSignal(batch, expected, .0002);
        AssertSignal(streamed, expected, .0002);
        Assert.That(batch.Last().X, Is.EqualTo(1).Within(.00001));
    }

    [TestCase(-1, 0)]
    [TestCase(1, -1)]
    [TestCase(1, 3)]
    [TestCase(int.MaxValue, 1)]
    public void InvalidSavitzkyGolayDesignIsRejected(int sidePoints, int order) =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new SavitzkyGolayFilter(sidePoints, order));

    [TestCase(-1)]
    [TestCase(int.MaxValue)]
    public void InvalidPolynomialOrderIsRejected(int order)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new PolynomialFitFilter(order));
        Assert.Throws<ArgumentOutOfRangeException>(() => new WeightedPolynomialFitFilter(order));
    }
}
