using ReFlex.Core.Common.Components;

namespace Common.Test;

public class Point2Test
{
    [SetUp]
    public void Setup()
    {
    }

    /// <summary>
    /// Test that Point2 is initialized with default values when using default constructor.
    /// </summary>
    [Test]
    public void TestDefaultConstructor()
    {
        var defaultPoint = new Point2();
        Assert.Multiple(() =>
        {
            Assert.That(defaultPoint.X, Is.EqualTo(0));
            Assert.That(defaultPoint.Y, Is.EqualTo(0));

            Assert.That(defaultPoint.IsValid, Is.True);

            Assert.That(defaultPoint.ToString, Is.EqualTo("X: 0; Y: 0"));
            
            Assert.That(defaultPoint.Equals(new Point2(0,0)), Is.True);
        });
    }

    /// <summary>
    /// Test that Point2 is initialized with values provided in the constructor.
    /// </summary>
    [Test]
    public void TestConstructorWithValues()
    {
        var x = (float) new Random().NextDouble();
        var y = (float) new Random().NextDouble();
            
        var point = new Point2(x,y);
        Assert.Multiple(() =>
        {
            Assert.That(point.X, Is.EqualTo(x));
            Assert.That(point.Y, Is.EqualTo(y));

            Assert.That(point.IsValid, Is.True);

            Assert.That(point.ToString, Is.EqualTo($"X: {x}; Y: {y}"));
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
            
        var point = new Point2(x,y);
        Assert.Multiple(() =>
        {
            Assert.That(point.IsValid, Is.True);

            Assert.That(point.ToString, Is.EqualTo($"X: {x}; Y: {y}"));
        });

        point.IsValid = false;
        Assert.Multiple(() =>
        {
            Assert.That(point.IsValid, Is.False);

            Assert.That(point.ToString, Is.EqualTo("invalid"));
        });
    }

    /// <summary>
    /// Test that Point2 is initialized with values from point provided in the constructor.
    /// </summary>
    [Test]
    public void TestCopyConstructor()
    {
        var x = (float)new Random().NextDouble();
        var y = (float)new Random().NextDouble();

        var originalPoint = new Point2(x, y);

        var copyPoint = new Point2(originalPoint);

        originalPoint.IsValid = false;
        originalPoint.X = y;
        originalPoint.Y = x;

        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.X, Is.EqualTo(y));
            Assert.That(originalPoint.Y, Is.EqualTo(x));

            Assert.That(originalPoint.IsValid, Is.False);

            Assert.That(copyPoint.X, Is.EqualTo(x));
            Assert.That(copyPoint.Y, Is.EqualTo(y));
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

        var originalPoint = new Point2(x, y);

        var copyPoint = originalPoint.Copy();
        
        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.X, Is.EqualTo(copyPoint.X));
            Assert.That(originalPoint.Y, Is.EqualTo(copyPoint.Y));

            Assert.That(originalPoint.IsValid, Is.EqualTo(copyPoint.IsValid));
            
            Assert.That(copyPoint.Equals(new Point2(x,y)), Is.True);
            Assert.That(originalPoint.Equals(copyPoint), Is.True);
        });

        originalPoint.IsValid = false;
        originalPoint.X = y;
        originalPoint.Y = x;

        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.X, Is.EqualTo(y));
            Assert.That(originalPoint.Y, Is.EqualTo(x));

            Assert.That(originalPoint.IsValid, Is.False);

            Assert.That(copyPoint.X, Is.EqualTo(x));
            Assert.That(copyPoint.Y, Is.EqualTo(y));
            Assert.That(copyPoint.IsValid, Is.True);
            
            Assert.That(copyPoint.Equals(new Point2(x,y)), Is.True);
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

        var originalPoint = new Point2(x, y);

        var setPoint = new Point2();

        originalPoint.IsValid = false;

        Assert.Multiple(() =>
        {
            Assert.That(setPoint.X, Is.EqualTo(0));
            Assert.That(setPoint.Y, Is.EqualTo(0));

            Assert.That(setPoint.IsValid, Is.True);
        });

        setPoint.Set(originalPoint);

        Assert.Multiple(() =>
        {
            Assert.That(setPoint.X, Is.EqualTo(originalPoint.X));
            Assert.That(setPoint.Y, Is.EqualTo(originalPoint.Y));

            Assert.That(setPoint.IsValid, Is.True);

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

        var originalPoint = new Point2(x, y);
        var copyPoint = originalPoint.Copy();

        Assert.That(originalPoint.Equals(copyPoint), Is.True);

        originalPoint.IsValid = false;

        Assert.Multiple(() =>
        {
            Assert.That(originalPoint.IsValid, Is.Not.EqualTo(copyPoint.IsValid));
            Assert.That(originalPoint.Equals(copyPoint), Is.True);
        });

        originalPoint.X = copyPoint.Y;

        Assert.That(originalPoint.Equals(copyPoint), Is.False);

        originalPoint.X = copyPoint.X;
        originalPoint.Y = copyPoint.X;

        Assert.That(originalPoint.Equals(copyPoint), Is.False);
    }
    
    /// <summary>
    /// Test that Direction is computed correctly.
    /// </summary>
    [Test]
    public void TestDirection()
    {
        var start = new Point2();
        var end = new Point2(5, -1);

        var direction = Point2.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(5));
        Assert.That(direction.Y, Is.EqualTo(-1));
        
        start.X = 7;
        direction = Point2.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(-2));
        Assert.That(direction.Y, Is.EqualTo(-1));
        
        end.Y= 3;
        direction = Point2.Direction(start, end);
        
        Assert.That(direction.X, Is.EqualTo(-2));
        Assert.That(direction.Y, Is.EqualTo(3));
    }

    /// <summary>
    /// Test that Points are Interpolated correctly.
    /// </summary>
    [Test]
    public void TestInterpolation()
    {
        var p1 = new Point2((float)new Random().NextDouble(), (float)new Random().NextDouble());
        var p2 = new Point2((float)new Random().NextDouble(), (float)new Random().NextDouble());

        var inter1 = Point2.Interpolate(p1, p2, 0);
        Assert.That(inter1.Equals(p1), Is.True);
        
        var inter2 = Point2.Interpolate(p1, p2, 1);
        Assert.That(inter2.Equals(p2), Is.True);
        
        var inter3 = Point2.Interpolate(p1, p2, 0.5f);
        Assert.That(inter3.Equals(new Point2(0.5f * (p1.X + p2.X), 0.5f * (p1.Y + p2.Y))), Is.True);
    }
}