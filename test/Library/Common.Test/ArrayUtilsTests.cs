using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Exceptions;
using Math = System.Math;

namespace Common.Test;

public class ArrayUtilsTests
{
    [SetUp]
    public void Setup()
    {
    }

    /// <summary>
    /// Test that initialization of the array works and that array values are initialized with default values of provided class.
    /// </summary>
    [Test]
    public void TestInitializationPlainArray()
    {
        var size = new Random().Next(500);
        
        ArrayUtils.InitializeArray<int>(out var intResult, size);

        Assert.That(intResult, Is.Not.Null);
        Assert.That(intResult.Length, Is.EqualTo(size));
        
        foreach (var i in intResult)
        {
            Assert.That(i, Is.EqualTo(0));
        }

        size = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out var p3Result, size);

        Assert.That(p3Result, Is.Not.Null);
        Assert.That(p3Result.Length, Is.EqualTo(size));
        
        foreach (var p3 in p3Result)
        {
            Assert.That(p3, Is.Not.Null);
            Assert.That(p3.X, Is.EqualTo(0));
            Assert.That(p3.Y, Is.EqualTo(0));
            Assert.That(p3.Z, Is.EqualTo(0));
            Assert.That(p3.IsValid, Is.EqualTo(true));
            Assert.That(p3.IsFiltered, Is.EqualTo(false));
        }
    }
    
    /// <summary>
    /// Test that initialization of the array works and that array values are initialized with default values of provided class.
    /// </summary>
    [Test]
    public void TestInitialization2dArray()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray(out int[,] intResult, sizeX, sizeY);

        Assert.That(intResult, Is.Not.Null);
        Assert.That(intResult.Length, Is.EqualTo(sizeX * sizeY));

        for (var i = 0; i < sizeX; i++)
        {
            for (var j = 0; j < sizeY; j++)
            {
                Assert.That(intResult[i,j], Is.EqualTo(0));
            }
        }
        
        sizeX = new Random().Next(500);
        sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out Point3[,] p3Result, sizeX, sizeY);

        Assert.That(p3Result, Is.Not.Null);
        Assert.That(p3Result.Length, Is.EqualTo(sizeX * sizeY));
        
        for (var i = 0; i < sizeX; i++)
        {
            for (var j = 0; j < sizeY; j++)
            {
                Assert.That(p3Result[i,j], Is.Not.Null);
                Assert.That(p3Result[i,j].X, Is.EqualTo(0));
                Assert.That(p3Result[i,j].Y, Is.EqualTo(0));
                Assert.That(p3Result[i,j].Z, Is.EqualTo(0));
                Assert.That(p3Result[i,j].IsValid, Is.EqualTo(true));
                Assert.That(p3Result[i,j].IsFiltered, Is.EqualTo(false));
            }
        }
    }
    
    /// <summary>
    /// Test that initialization of the array works and that array values are initialized with default values of provided class.
    /// </summary>
    [Test]
    public void TestInitializationJaggedArray()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray(out int[][] intResult, sizeX, sizeY);

        Assert.That(intResult, Is.Not.Null);
        Assert.That(intResult.Length, Is.EqualTo(sizeX));

        for (var i = 0; i < sizeX; i++)
        {
            var row = intResult[i];
            Assert.That(row.Length, Is.EqualTo(sizeY));
            
            for (var j = 0; j < sizeY; j++)
            {
                Assert.That(row[j], Is.EqualTo(0));
            }
        }
        
        sizeX = new Random().Next(500);
        sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out Point3[][] p3Result, sizeX, sizeY);

        Assert.That(p3Result, Is.Not.Null);
        Assert.That(p3Result.Length, Is.EqualTo(sizeX));
        
        for (var i = 0; i < sizeX; i++)
        {
            var row = p3Result[i];
            Assert.That(row.Length, Is.EqualTo(sizeY));
            
            for (var j = 0; j < sizeY; j++)
            {
                Assert.That(row[j], Is.Not.Null);
                Assert.That(row[j].X, Is.EqualTo(0));
                Assert.That(row[j].Y, Is.EqualTo(0));
                Assert.That(row[j].Z, Is.EqualTo(0));
                Assert.That(row[j].IsValid, Is.EqualTo(true));
                Assert.That(row[j].IsFiltered, Is.EqualTo(false));
            }
        }
    }

    [Test]
    public void TestReferencingArraysPlainWithDifferentArrays()
    {
        var size = new Random().Next(500);
        ArrayUtils.InitializeArray<Point3>(out var src, size);
        ArrayUtils.InitializeArray<Point3>(out var target, size);

        for (var i = 0; i < size; i++)
        {
            src[i] = CreateRandomPoint();
            target[i] = CreateRandomPoint();
            
            Assert.That(CheckEquality(src[i], target[i]), Is.False);
        }
        
        ArrayUtils.ReferencingArrays(src, target);
        
        for (var i = 0; i < size; i++)
        {
            Assert.That(CheckEquality(src[i], target[i]), Is.True);
        }
    }
    
    [Test]
    public void TestReferencingArraysPlainWithEmptyArrays()
    {
        var size = new Random().Next(500);
        ArrayUtils.InitializeArray<Point3>(out var src, size);
        ArrayUtils.InitializeArray<Point3>(out var target, size);

        for (var i = 0; i < size; i++)
        {
            src[i] = CreateRandomPoint();

            Assert.That(CheckEquality(src[i], target[i]), Is.False);
        }
        
        ArrayUtils.ReferencingArrays(src, target);
        
        for (var i = 0; i < size; i++)
        {
            Assert.That(CheckEquality(src[i], target[i]), Is.True);
        }
    }
    
    [Test]
    public void TestReferencingArraysPlainThrowsException()
    {
        var size = new Random().Next(500);
        ArrayUtils.InitializeArray<Point3>(out var src, size);
        ArrayUtils.InitializeArray<Point3>(out var target, size / 2);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target), Throws.TypeOf<ArraysWithDifferentSizesException>());
    }
    
    [Test]
    public void TestReferencingArrays2dWithEmptyArrays()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out var src, sizeX * sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target, sizeX, sizeY);

        for (var i = 0; i < sizeX * sizeY; i++)
        {
            src[i] = CreateRandomPoint();
        }
        
        ArrayUtils.ReferencingArrays(src, target);
        
        for (var i = 0; i < sizeX * sizeY; i++)
        {
            var row = i / sizeX;
            var col = i % sizeX;
                
            Assert.That(CheckEquality(src[i], target[col, row]), Is.True);
        }
    }
    
    [Test]
    public void TestReferencingArrays2dThrowsException()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out var src, sizeX * sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target, sizeX, sizeY -1);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target), Throws.TypeOf<ArraysWithDifferentSizesException>());
        
        // transposed array should work
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target2, sizeY, sizeX);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target2), Throws.Nothing);
    }
    
    [Test]
    public void TestReferencingArrays2dBothWithEmptyArrays()
    {
        var sizeX = new Random().Next(50);
        var sizeY = new Random().Next(50);
        
        ArrayUtils.InitializeArray<Point3>(out Point3[,] src, sizeX,sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target, sizeX, sizeY);

        for (var i = 0; i < sizeX; i++)
            for (var j = 0; j < sizeY; j++)
                src[i, j] = CreateRandomPoint();
        
        ArrayUtils.ReferencingArrays(src, target);
        
        for (var i = 0; i < sizeX * sizeY; i++)
        {
            var row = i / sizeX;
            var col = i % sizeX;
                
            Assert.That(CheckEquality(src[col, row], target[col, row]), Is.True);
        }
    }
    
    [Test]
    public void TestReferencingArrays2dBothThrowsException()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out Point3[,] src, sizeX, sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target, sizeX, sizeY -1);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target), Throws.TypeOf<ArraysWithDifferentSizesException>());
        
        // transposed array should NOT work
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target2, sizeY, sizeX);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target2), Throws.TypeOf<ArraysWithDifferentSizesException>());
        
        //assert that second dimension is checked too
        ArrayUtils.InitializeArray<Point3>(out Point3[,] target3, sizeX, sizeX);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target3), Throws.TypeOf<ArraysWithDifferentSizesException>());
    }
    
    [Test]
    public void TestReferencingArraysJaggedWithEmptyArrays()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out var src, sizeX * sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target, sizeX, sizeY);

        for (var i = 0; i < sizeX * sizeY; i++)
        {
            src[i] = CreateRandomPoint();
        }
        
        ArrayUtils.ReferencingArrays(src, target);
        
        for (var i = 0; i < sizeX * sizeY; i++)
        {
            var row = i / sizeX;
            var col = i % sizeX;
                
            Assert.That(CheckEquality(src[i], target[col][row]), Is.True);
        }
    }
    
    [Test]
    public void TestReferencingArraysJaggedThrowsException()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out var src, sizeX * sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target, sizeX, sizeY -1);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target), Throws.TypeOf<ArraysWithDifferentSizesException>());
        
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target2, sizeY, sizeX);

        // transposed array should work
        Assert.That(() => ArrayUtils.ReferencingArrays(src, target2), Throws.Nothing);
    }
    
    [Test]
    public void TestReferencingArraysJaggedBothWithEmptyArrays()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out Point3[][] src, sizeX, sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target, sizeX, sizeY);

        for (var i = 0; i < sizeX; i++)
        {
            for (var j = 0; j < sizeY; j++)
                src[i][j] = CreateRandomPoint();
        }
        
        ArrayUtils.ReferencingArrays(src, target);
        
        for (var i = 0; i < sizeX * sizeY; i++)
        {
            var row = i / sizeX;
            var col = i % sizeX;
                
            Assert.That(CheckEquality(src[col][row], target[col][row]), Is.True);
        }
    }
    
    [Test]
    public void TestReferencingArraysJaggedBothThrowsException()
    {
        var sizeX = new Random().Next(500);
        var sizeY = new Random().Next(500);
        
        ArrayUtils.InitializeArray<Point3>(out Point3[][] src, sizeX, sizeY);
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target, sizeX, sizeY - 1);

        Assert.That(() => ArrayUtils.ReferencingArrays(src, target), Throws.TypeOf<ArraysWithDifferentSizesException>());
        
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target2, sizeY, sizeX);

        // transposed array DO NOT work
        Assert.That(() => ArrayUtils.ReferencingArrays(src, target2), Throws.TypeOf<ArraysWithDifferentSizesException>());
        
        ArrayUtils.InitializeArray<Point3>(out Point3[][] target3, sizeY, sizeY);

        // assert that also the second dimension is checked
        Assert.That(() => ArrayUtils.ReferencingArrays(src, target2), Throws.TypeOf<ArraysWithDifferentSizesException>());
    }

    private Point3 CreateRandomPoint()
    {
        const int rndMax = 100;
        
        var rdn = new Random();
        var result = new Point3
        {
            X = rdn.Next(rndMax) / (float) rndMax,
            Y = rdn.Next(rndMax) / (float) rndMax,
            Z = 2f * (rdn.Next(rndMax) / (float) rndMax) - 1f,
            IsValid = rdn.Next(rndMax) % 2 == 0
        };
        
        result.IsFiltered = !result.IsValid;

        return result;
    }

    private bool CheckEquality(Point3 src, Point3 target)
    {
        double tolerance = 0.001f;
        return Math.Abs(src.X - target.X) < tolerance &&
               Math.Abs(src.Y - target.Y) < tolerance &&
               Math.Abs(src.Z - target.Z) < tolerance &&
               src.IsValid == target.IsValid &&
               src.IsFiltered == target.IsFiltered;
    }
}