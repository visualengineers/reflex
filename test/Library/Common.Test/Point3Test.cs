using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace Common.Test;

public class Point3Test
{
    [SetUp]
    public void Setup()
    {
    }

    /// <summary>
    /// Test that Point3 is initialized with default values when using default constructor.
    /// </summary>
    [Test]
    public void TestDefaultConstructor()
    {
        var defaultPoint = new Point3();
        Assert.Multiple(() =>
        {
            Assert.That(defaultPoint.X, Is.EqualTo(0));
            Assert.That(defaultPoint.Y, Is.EqualTo(0));
            Assert.That(defaultPoint.Y, Is.EqualTo(0));

            Assert.That(defaultPoint.IsValid, Is.True);
            Assert.That(defaultPoint.IsFiltered, Is.False);
            
            Assert.That(defaultPoint.Equals(new Point3(0,0, 0)), Is.True);
        });
    }
    
    /// <summary>
    /// Test that Point3 is initialized with values provided in the constructor.
    /// </summary>
    [Test]
    public void TestConstructorWithValues()
    {
        var x = (float) new Random().NextDouble();
        var y = (float) new Random().NextDouble();
        var z = (float) new Random().NextDouble();
            
        var point = new Point3(x,y,z);
        Assert.Multiple(() =>
        {
            Assert.That(point.X, Is.EqualTo(x));
            Assert.That(point.Y, Is.EqualTo(y));
            Assert.That(point.Z, Is.EqualTo(z));

            Assert.That(point.IsValid, Is.True);
            Assert.That(point.IsFiltered, Is.False);
        });
    }
    
    /// <summary>
    /// Test custom string representation is valid.
    /// </summary>
    [Test]
    public void TestToString()
    {
        var x = (float) new Random().NextDouble();
        var y = (float) new Random().NextDouble();
        var z = (float) new Random().NextDouble();
            
        var point = new Point3(x,y,z);
        Assert.Multiple(() =>
        {
            Assert.That(point.IsValid, Is.True);

            Assert.That(point.ToString, Is.EqualTo($"X: {x}; Y: {y}; Z: {z}"));
        });

        point.IsValid = false;
        Assert.Multiple(() =>
        {
            Assert.That(point.IsValid, Is.False);

            Assert.That(point.ToString, Is.EqualTo("invalid"));
        });
    }

    /// <summary>
    /// Test that Point3 is initialized with values from point provided in the constructor.
    /// </summary>
    [Test]
    public void TestCopyConstructor()
    {
        var x = (float)new Random().NextDouble();
        var y = (float)new Random().NextDouble();
        var z = (float)new Random().NextDouble();

        var originalPoint = new Point3(x, y,z);

        var copyPoint = new Point3(originalPoint);

        originalPoint.IsValid = false;
        originalPoint.X = z;
        originalPoint.Y = x;
        originalPoint.Z = y;

        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.X, Is.EqualTo(z));
            Assert.That(originalPoint.Y, Is.EqualTo(x));
            Assert.That(originalPoint.Z, Is.EqualTo(y));

            Assert.That(originalPoint.IsValid, Is.False);

            Assert.That(copyPoint.X, Is.EqualTo(x));
            Assert.That(copyPoint.Y, Is.EqualTo(y));
            Assert.That(copyPoint.Z, Is.EqualTo(z));
            Assert.That(copyPoint.IsValid, Is.True);
            
            Assert.That(originalPoint.Equals(copyPoint), Is.False);
        });
    }
    
    /// <summary>
    /// Test that Copy() creates a real copy.
    /// </summary>
    [Test]
    public void TestCopy()
    {
        var x = (float)new Random().NextDouble();
        var y = (float)new Random().NextDouble();
        var z = (float)new Random().NextDouble();

        var originalPoint = new Point3(x, y, z);
        originalPoint.IsValid = false;
        originalPoint.IsFiltered = true;

        var copyPoint = originalPoint.Copy();
        
        Assert.Multiple(() =>
        {
            Assert.That(copyPoint, Is.Not.Null);
            
            Assert.That(originalPoint.X, Is.EqualTo(copyPoint.X));
            Assert.That(originalPoint.Y, Is.EqualTo(copyPoint.Y));
            Assert.That(originalPoint.Z, Is.EqualTo(copyPoint.Z));

            Assert.That(originalPoint.IsValid, Is.EqualTo(copyPoint.IsValid));
            Assert.That(originalPoint.IsFiltered, Is.EqualTo(copyPoint.IsFiltered));
            
            Assert.That(copyPoint.Equals(new Point3(x, y, z)), Is.True);
            Assert.That(originalPoint.Equals(copyPoint), Is.True);
        });

        originalPoint.IsValid = true;
        originalPoint.IsFiltered = false;
        originalPoint.X = z;
        originalPoint.Y = x;
        originalPoint.Z = y;

        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.X, Is.EqualTo(z));
            Assert.That(originalPoint.Y, Is.EqualTo(x));
            Assert.That(originalPoint.Z, Is.EqualTo(y));

            Assert.That(originalPoint.IsValid, Is.True);
            Assert.That(originalPoint.IsFiltered, Is.False);

            Assert.That(copyPoint.X, Is.EqualTo(x));
            Assert.That(copyPoint.Y, Is.EqualTo(y));
            Assert.That(copyPoint.Z, Is.EqualTo(z));
            Assert.That(copyPoint.IsValid, Is.False);
            Assert.That(copyPoint.IsFiltered, Is.True);
            
            Assert.That(copyPoint.Equals(new Point3(x,y,z)), Is.True);
            Assert.That(originalPoint.Equals(copyPoint), Is.False);
        });
    }

    /// <summary>
    /// Test that Set() only changes coordinates.
    /// </summary>
    [Test]
    public void TestSet()
    {
        var x = (float)new Random().NextDouble();
        var y = (float)new Random().NextDouble();
        var z = (float)new Random().NextDouble();

        var originalPoint = new Point3(x, y, z);

        var setPoint = new Point3();

        originalPoint.IsValid = false;
        originalPoint.IsFiltered = true;

        Assert.Multiple(() =>
        {
            Assert.That(setPoint.X, Is.EqualTo(0));
            Assert.That(setPoint.Y, Is.EqualTo(0));
            Assert.That(setPoint.Z, Is.EqualTo(0));

            Assert.That(setPoint.IsValid, Is.True);
            Assert.That(setPoint.IsFiltered, Is.False);
        });

        setPoint.Set(originalPoint);

        Assert.Multiple(() =>
        {
            Assert.That(setPoint.X, Is.EqualTo(originalPoint.X));
            Assert.That(setPoint.Y, Is.EqualTo(originalPoint.Y));
            Assert.That(setPoint.Z, Is.EqualTo(originalPoint.Z));

            Assert.That(setPoint.IsValid, Is.True);
            Assert.That(setPoint.IsFiltered, Is.False);

            Assert.That(originalPoint.Equals(setPoint), Is.True);
        });
    }

    /// <summary>
    /// Test that Equals only compares coordinates.
    /// </summary>
    [Test]
    public void TestEquality()
    {
        var x = (float)new Random().NextDouble();
        var y = x - 0.5f;
        var z = x + 0.5f;

        var originalPoint = new Point3(x, y, z);
        var copyPoint = originalPoint.Copy();

        Assert.That(originalPoint.Equals(copyPoint), Is.True);

        originalPoint.IsValid = false;
        originalPoint.IsFiltered = true;

        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.IsValid, Is.Not.EqualTo(copyPoint.IsValid));
            Assert.That(originalPoint.IsFiltered, Is.Not.EqualTo(copyPoint.IsFiltered));
            Assert.That(originalPoint.Equals(copyPoint), Is.True);
        });

        originalPoint.X = copyPoint.Y;

        Assert.That(originalPoint.Equals(copyPoint), Is.False);

        originalPoint.X = copyPoint.X;
        originalPoint.Y = copyPoint.Z;

        Assert.That(originalPoint.Equals(copyPoint), Is.False);
        
        originalPoint.Y = copyPoint.Y;
        originalPoint.Z = copyPoint.X;

        Assert.That(originalPoint.Equals(copyPoint), Is.False);
        
        Assert.That(originalPoint.Equals(null), Is.False);
    }
    
    /// <summary>
    /// Test that Direction is computed correctly.
    /// </summary>
    [Test]
    public void TestDirection()
    {
        var start = new Point3();
        var end = new Point3(5, -1, 0);

        var direction = Point3.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(5));
        Assert.That(direction.Y, Is.EqualTo(-1));
        Assert.That(direction.Z, Is.EqualTo(0));
        
        start.X = 7;
        direction = Point3.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(-2));
        Assert.That(direction.Y, Is.EqualTo(-1));
        Assert.That(direction.Z, Is.EqualTo(0));
        
        end.Y = 3;
        direction = Point3.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(-2));
        Assert.That(direction.Y, Is.EqualTo(3));
        Assert.That(direction.Z, Is.EqualTo(0));
        
        end.Z = 5.5f;
        direction = Point3.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(-2));
        Assert.That(direction.Y, Is.EqualTo(3));
        Assert.That(direction.Z, Is.EqualTo(5.5f));
    }
    
    /// <summary>
    /// Test that Points are Interpolated correctly.
    /// </summary>
    [Test]
    public void TestInterpolation()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var p2 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());

        var inter1 = Point3.Interpolate(p1, p2, 0);
        Assert.That(inter1.Equals(p1), Is.True);
        
        var inter2 = Point3.Interpolate(p1, p2, 1);
        Assert.That(inter2.Equals(p2), Is.True);
        
        var inter3 = Point3.Interpolate(p1, p2, 0.5f);
        Assert.That(inter3.Equals(new Point3(0.5f * (p1.X + p2.X), 0.5f * (p1.Y + p2.Y), 0.5f * (p1.Z + p2.Z))), Is.True);
    }

    /// <summary>
    /// Test that Points are added correctly.
    /// </summary>
    [Test]
    public void TestAddition()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var p2 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());

        var expected = new Point3(p1.X + p2.X, p1.Y + p2.Y, p1.Z + p2.Z);
        
        Assert.That(expected.Equals(p1+p2), Is.True);
    }
    
    /// <summary>
    /// Test that Points are subtracted correctly.
    /// </summary>
    [Test]
    public void TestSubtraction()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var p2 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());

        var expected = new Point3(p1.X - p2.X, p1.Y - p2.Y, p1.Z - p2.Z);
        
        Assert.That(expected.Equals(p1-p2), Is.True);
    }
    
    /// <summary>
    /// Test that Points are multiplied with scalars correctly.
    /// </summary>
    [Test]
    public void TestScalarMultiplication()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var s = (float)new Random().NextDouble();

        var expected = new Point3(p1.X * s, p1.Y * s, p1.Z * s);
        
        Assert.That(expected.Equals(p1*s), Is.True);
    }
    
    /// <summary>
    /// Test that Points are divided with scalars correctly.
    /// </summary>
    [Test]
    public void TestScalarDivision()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var s = (float)new Random().NextDouble() + 0.1f;
        var rez = 1.0f / s;

        var expected = new Point3(p1.X * rez, p1.Y * rez, p1.Z * rez);
        
        Assert.That(expected.Equals(p1/s), Is.True);

        var zero = 0;
        var eps = 1.0f / float.Epsilon;
        
        Assert.That((p1/zero).Equals(new Point3(p1.X * eps, p1.Y * eps, p1.Z * eps)), Is.True);
    }
    
    /// <summary>
    /// Test that Distance is computed correctly.
    /// </summary>
    [Test]
    public void TestDistance()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var p2 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());

        var dist = Point3.Distance(p1, p2);
        var expected = (float) Math.Sqrt(Math.Pow(p2.X - p1.X, 2f) + Math.Pow(p2.Y - p1.Y, 2f) + Math.Pow(p2.Z - p1.Z, 2f)); 
        
        Assert.That(Math.Abs(expected - dist) <= float.Epsilon, Is.True);
    }
    
    /// <summary>
    /// Test that 2D Distance is computed correctly.
    /// </summary>
    [Test]
    public void TestDistance2D()
    {
        var p1 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());
        var p2 = new Point3((float)new Random().NextDouble(), (float)new Random().NextDouble(), (float)new Random().NextDouble());

        var dist = Point3.Squared2DDistance(p1, p2);
        var expected = Math.Abs(p2.X - p1.X) + Math.Abs(p2.Y - p1.Y);
        Assert.That(Math.Abs(expected - dist) < float.Epsilon, Is.True);
    }
}