using PointCloud.Benchmark.Benchmarks.IteratePointCloud;
using ReFlex.Core.Common.Components;
using PointCloud3 = PointCloud.Benchmark.Common.PointCloud3;

namespace PointCloud.Test;

public class PointCloudTests
{
    private IterationMethods2? _iteration, _iterationSynthetic;
    private PointCloud3? _pCloud, _pCloudSynthetic;
    
    [SetUp]
    public void Setup()
    {
        _iteration = new IterationMethods2();
        _pCloud = _iteration.Points;

        // floating point precision: adding 1 mio. items leads to rounding issues
        var dimX = 110;
        var dimY = 230;
        _pCloudSynthetic = new PointCloud3(dimX, dimY);
        var points = new Point3[dimX * dimY];
        var rnd = new Random();
        for (var i = 0; i < dimX * dimY; i++)
        {
            var pX = rnd.Next(255);
            var pY = rnd.Next(255);
            var pZ = rnd.Next(255);

            points[i] = new Point3(pX, pY, pZ);
        }
        
        _pCloudSynthetic.Update(points);

        _iterationSynthetic = new IterationMethods2(points, dimX, dimY);

    }

    [Test]
    public void TestPointCloudIndex()
    {
        Assert.That(_pCloud, Is.Not.Null);
        if (_pCloud == null)
            return;
        
        var jaggedArray = _pCloud.AsJaggedArray();
        for (var x = 0; x < _pCloud.SizeX; x++)
        {
            for (var y = 0; y < _pCloud.SizeY; y++)
            {
                var value = _pCloud[x, y];
                var valueJagged = jaggedArray[x][y];
                Assert.That(value, Is.EqualTo(valueJagged));
                Assert.That(value.X, Is.EqualTo(valueJagged.X));
                Assert.That(value.Y, Is.EqualTo(valueJagged.Y));
                Assert.That(value.Z, Is.EqualTo(valueJagged.Z));
            }
        }
    }
    
    [Test]
    public void TestPointCloudIndexMapping()
    {
        Assert.That(_pCloud, Is.Not.Null);
        if (_pCloud == null)
            return;
        
        Assert.That(_iteration, Is.Not.Null);
        if (_iteration == null)
            return;
        
        var jaggedArray = _pCloud.AsJaggedArray();
        var array = _pCloud.AsSpan();

        var nJagged = 0;
        var n = 0;
        
        for (var x = 0; x < _pCloud.SizeX; x++)
        {
            for (var y = 0; y < _pCloud.SizeY; y++)
            {
                var valueJagged = jaggedArray[x][y];

                _iteration.ComputeIndex(x, y, out var idx);
                var valueIdx = _pCloud[idx];
                var valueArrayIdx = array[idx];
                
                Assert.That(valueArrayIdx, Is.EqualTo(valueIdx));
                Assert.That(valueArrayIdx.X, Is.EqualTo(valueIdx.X));
                Assert.That(valueArrayIdx.Y, Is.EqualTo(valueIdx.Y));
                Assert.That(valueArrayIdx.Z, Is.EqualTo(valueIdx.Z));
                
                Assert.That(valueIdx, Is.EqualTo(valueJagged));
                Assert.That(valueIdx.X, Is.EqualTo(valueJagged.X));
                Assert.That(valueIdx.Y, Is.EqualTo(valueJagged.Y));
                Assert.That(valueIdx.Z, Is.EqualTo(valueJagged.Z));
                
                _iteration.ComputeColRow(idx, out var cx, out var cy);
                Assert.That(x, Is.EqualTo(cx));
                Assert.That(y, Is.EqualTo(cy));

                nJagged++;
            }
        }

        for (var i = 0; i < array.Length; i++)
        {
            var valueIdx = _pCloud[i];

            _iteration.ComputeColRow(i, out var x, out var y);
            var valueArrayIdx = array[i];
            var valueJagged = jaggedArray[x][y];
                
            Assert.That(valueArrayIdx, Is.EqualTo(valueIdx));
            Assert.That(valueArrayIdx.X, Is.EqualTo(valueIdx.X));
            Assert.That(valueArrayIdx.Y, Is.EqualTo(valueIdx.Y));
            Assert.That(valueArrayIdx.Z, Is.EqualTo(valueIdx.Z));
                
            Assert.That(valueIdx, Is.EqualTo(valueJagged));
            Assert.That(valueIdx.X, Is.EqualTo(valueJagged.X));
            Assert.That(valueIdx.Y, Is.EqualTo(valueJagged.Y));
            Assert.That(valueIdx.Z, Is.EqualTo(valueJagged.Z));
                
            _iteration.ComputeIndex(x, y, out var idx);
            Assert.That(i, Is.EqualTo(idx));

            n++;
        }

        Assert.That(nJagged, Is.EqualTo(n));
    }
    
    [Test]
    public void TestPointCloudInvalidIndex()
    {
        Assert.That(_pCloud, Is.Not.Null);
        if (_pCloud == null)
            return;
        
        var negative = _pCloud[-1];
        Assert.That(negative, Is.Not.Null);
        Assert.That(negative, Is.TypeOf<Point3>());
        
        var outOfBounds = _pCloud[_pCloud.Size];
        Assert.That(outOfBounds, Is.Not.Null);
        Assert.That(outOfBounds, Is.TypeOf<Point3>());

        // Assert that exception is thrown, but resulting point is NOT null !
        Assert.Throws<IndexOutOfRangeException>(() =>
        {
            var negX = _pCloud[-1, 100];
            Assert.That(negX, Is.Not.Null);
            Assert.That(negX, Is.TypeOf<Point3>());
        });

        // Assert that exception is thrown, but resulting point is NOT null !
        Assert.Throws<IndexOutOfRangeException>(() =>
        {
            var negY = _pCloud[100, -1];
            Assert.That(negY, Is.Not.Null);
            Assert.That(negY, Is.TypeOf<Point3>());
        });

        Assert.Throws<IndexOutOfRangeException>(() =>
        {
            var outOfBoundsX = _pCloud[_pCloud.SizeX, 100];
            Assert.That(outOfBoundsX, Is.Not.Null);
            Assert.That(outOfBoundsX, Is.TypeOf<Point3>());
        });

        Assert.Throws<IndexOutOfRangeException>(() =>
        {
            var outOfBoundsY = _pCloud[100, _pCloud.SizeY];
            Assert.That(outOfBoundsY, Is.Not.Null);
            Assert.That(outOfBoundsY, Is.TypeOf<Point3>());
        });

    }

    [Test]
    public void TestIterationMethods()
    {
        Assert.That(_iterationSynthetic, Is.Not.Null);
        if (_iterationSynthetic == null)
            return;
        
        var resultJaggedArray = _iterationSynthetic.IterateJaggedArray();
        Console.WriteLine($"JaggedArray:  ({resultJaggedArray.Item2}) {resultJaggedArray.Item1}");
        
        var result2dIndex = _iterationSynthetic.Iterate2dIndex();
        Console.WriteLine($"2d Index: ({result2dIndex.Item2}) {result2dIndex.Item1}");
        
        var resultArray = _iterationSynthetic.IterateArray();
        Console.WriteLine($"Array: ({resultArray.Item2}) {resultArray.Item1}");
        
        var resultArrayCommutative = _iterationSynthetic.IterateArrayCommutative();
        Console.WriteLine($"Array (Commutative): ({resultArrayCommutative.Item2}) {resultArrayCommutative.Item1}");

        var result2dReconstruction = _iterationSynthetic.Iterate2dIndexReconstruction();
        Console.WriteLine($"2d Reconstruction: ({result2dReconstruction.Item2}) {result2dReconstruction.Item1}");
        
        var resultIterateSpan = _iterationSynthetic.IterateSpan();
        Console.WriteLine($"Span: ({resultIterateSpan.Item2}) {resultIterateSpan.Item1}");
        
        var resultIterateSpanCommutative = _iterationSynthetic.IterateSpanCommutative();
        Console.WriteLine($"Span (Commutative): ({resultIterateSpanCommutative.Item2}) {resultIterateSpanCommutative.Item1}");
        
        Assert.That(resultArray, Is.EqualTo(resultJaggedArray));
        Assert.That(resultArrayCommutative, Is.EqualTo(resultJaggedArray));
        
        Assert.That(result2dIndex, Is.EqualTo(resultJaggedArray));
        
        Assert.That(result2dReconstruction, Is.EqualTo(resultJaggedArray));
        
        Assert.That(resultIterateSpan, Is.EqualTo(resultJaggedArray));
        
        Assert.That(resultIterateSpanCommutative, Is.EqualTo(resultJaggedArray));
    }
}