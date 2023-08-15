using ReFlex.Core.Common.Components;

namespace Common.Test;

public class MathUtilsTest
{
    const float Tolerance = 0.01f;
    
    [SetUp]
    public void Setup()
    {
    }

    [TestCase(0.07f)]
    [TestCase(0.015f)]
    [TestCase(2f)]
    [TestCase(3f)]
    [TestCase(5f)]
    [TestCase(87f)]
    [TestCase(113f)]
    [TestCase(257f)]
    [TestCase(1047f)]
    [TestCase(10.456f)]
    [TestCase(1.047f)]
    public void TestSqrt(float f)
    {
        var mSqrt2 = Math.Sqrt(f);
        var cSqrt = MathUtils.Sqrt(f);
                
        Assert.That(Math.Abs(mSqrt2-cSqrt) < 0.05f * f);
    }
    
    [TestCase(0.07f)]
    [TestCase(0.015f)]
    [TestCase(2f)]
    [TestCase(3f)]
    [TestCase(5f)]
    [TestCase(87f)]
    [TestCase(113f)]
    [TestCase(257f)]
    [TestCase(1047f)]
    [TestCase(10.456f)]
    [TestCase(1.047f)]
    public void TestInverseSqrt(float f)
    {
        var mSqrt2 = Math.Sqrt(f);
        var cSqrt = MathUtils.InverseSqrt(f);
                
        Assert.That(Math.Abs(mSqrt2-cSqrt) < 0.02f * f);
    }

    [Test]
    public void TestSqrt0()
    {
        Assert.That(MathUtils.Sqrt(0), Is.EqualTo(0));
        Assert.That(MathUtils.InverseSqrt(0), Is.EqualTo(0));
    }
    
    [Test]
    public void TestNegativeSqrt()
    {
        Assert.That(float.IsNegativeInfinity(MathUtils.InverseSqrt(-2f)), Is.True);
        Assert.That(float.IsNaN(MathUtils.Sqrt(-2f)), Is.True);
    }

    [TestCase(0.1, 0, 1, 0, -1, -0.1)]
    [TestCase(0.375, 0, 1, 1, 2, 1.375)]
    [TestCase(-0.1, 0, 1, 1, 2, 0.9)]
    [TestCase(3.5, 2, 4, 3, 6, 5.25)]
    [TestCase(1, -1.5, 2.5, 1, 9, 6)]
    [TestCase(1, 1.5, -2.5, 1, 9, 2)]
    [TestCase(3.1, 0.5, 1.5, 7, 10, 14.8)]
    public void TestRemapping(double value, double from1, double to1, double from2, double to2, double expectation)
    {
        var remapped = MathUtils.Remap(value, from1, to1, from2, to2);

        Assert.That(remapped, Is.EqualTo(expectation));
    }
}