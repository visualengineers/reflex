using Math = ReFlex.Core.Common.Components.Math;

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
        var mSqrt2 = System.Math.Sqrt(f);
        var cSqrt = Math.Sqrt(f);
                
        Assert.That(System.Math.Abs(mSqrt2-cSqrt) < 0.05f * f);
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
        var mSqrt2 = System.Math.Sqrt(f);
        var cSqrt = Math.InverseSqrt(f);
                
        Assert.That(System.Math.Abs(mSqrt2-cSqrt) < 0.02f * f);
    }

    [Test]
    public void TestSqrt0()
    {
        Assert.That(Math.Sqrt(0), Is.EqualTo(0));
        Assert.That(Math.InverseSqrt(0), Is.EqualTo(0));
    }
    
    [Test]
    public void TestNegativeSqrt()
    {
        Assert.That(float.IsNegativeInfinity(Math.InverseSqrt(-2f)), Is.True);
        Assert.That(float.IsNaN(Math.Sqrt(-2f)), Is.True);
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
        var remapped = Math.Remap(value, from1, to1, from2, to2);

        Assert.That(remapped, Is.EqualTo(expectation));
    }

    [TestCase(0,0,0,0)]
    [TestCase(-1,0,1,0)]
    [TestCase(2,1,1.5,1.5)]
    [TestCase(0.5,-1,1,0.5)]
    [TestCase(2,1,-1, 1)]
    [TestCase(-3,0,-1, -1)]
    public void TestClamping(double value, double min, double max, double expectation)
    {
        var clamped = Math.Clamp(value, min, max);
        
        Assert.That(clamped, Is.EqualTo(expectation));
    }
    
    [Test]
    public void TestExponentialMapping()
    {
        var divisor = System.Math.E - 1;
        
        var mapped1 = Math.ExponentialMapping(1);
        Assert.That(mapped1, Is.EqualTo(1.0 / divisor));
        
        var mappedMinus1 = Math.ExponentialMapping(-1);
        Assert.That(mappedMinus1, Is.EqualTo(System.Math.Exp(-2) / divisor));
        
        var mapped0 = Math.ExponentialMapping(0);
        Assert.That(mapped0, Is.EqualTo(System.Math.Exp(-1) / divisor));
        
        var mapped05 = Math.ExponentialMapping(0.5);
        Assert.That(mapped05, Is.EqualTo(System.Math.Exp(-0.5) / divisor));
    }
    
    [Test]
    public void TestLogarithmicMapping()
    {
        var divisor = System.Math.Log(2, System.Math.E);
        
        var mapped1 = Math.LogarithmicMapping(1);
        Assert.That(mapped1, Is.EqualTo(1.0));
        
        var mappedMinus1 = Math.LogarithmicMapping(-1);
        Assert.That(mappedMinus1, Is.EqualTo(double.NegativeInfinity));
        
        var mappedMinus2 = Math.LogarithmicMapping(-2);
        Assert.That(mappedMinus2, Is.EqualTo(double.NaN));
        
        var mapped0 = Math.LogarithmicMapping(0);
        Assert.That(mapped0, Is.EqualTo(0.0));
        
        var mappedMinus15 = Math.LogarithmicMapping(-1.5);
        Assert.That(mappedMinus15, Is.EqualTo(double.NaN));
        
        var mapped15 = Math.LogarithmicMapping(1.5);
        Assert.That(mapped15, Is.EqualTo(System.Math.Log(2.5, System.Math.E) / divisor));
    }
}