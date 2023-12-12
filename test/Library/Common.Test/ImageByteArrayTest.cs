using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace Common.Test;

[TestFixture]
public class ImageByteArrayTest
{
    [SetUp]
    public void Setup()
    {
    }

    [TestCase]
    public void TestEmptyImageData()
    {
        var mockData = Array.Empty<byte>();

        var array = new ImageByteArray(mockData, 0, 0, 0, 0, DepthImageFormat.Greyscale8bpp);
        
        Assert.That(array.Width, Is.EqualTo(0));
        Assert.That(array.Height, Is.EqualTo(0));
        Assert.That(array.BytesPerChannel, Is.EqualTo(0));
        Assert.That(array.NumChannels, Is.EqualTo(0));
        Assert.That(array, Is.Not.Null);
        Assert.That(array.ImageData, Is.Empty);
        Assert.That(array.Format, Is.EqualTo(DepthImageFormat.Greyscale8bpp));
    }

    [TestCase]
    public void TestNullReferenceException()
    {
        Assert.Throws<NullReferenceException>(() =>
        {
            var imageByteArray = new ImageByteArray(null, 0, 0, 0, 0);
        });
    }
    
    /// <summary>
    /// Checks if correct array size is checked in constructor and <seealso cref="ArgumentException"/> is thrown if the size of the provided imageData array is incorrect.
    /// </summary>
    [TestCase]
    public void TestCheckSizeInInitialization()
    {
        const int width = 10;
        const int height = 25;
        const uint bytesChannel = 3u;
        const uint channels = 2u;

        var data = new byte[width * height * bytesChannel * channels];
        
        Assert.Throws<ArgumentException>(() =>
        {
            var imageByteArray = new ImageByteArray(data, width-1, height, bytesChannel, channels);
        });
        
        Assert.Throws<ArgumentException>(() =>
        {
            var imageByteArray = new ImageByteArray(data, width, height-1, bytesChannel, channels);
        });
        
        Assert.Throws<ArgumentException>(() =>
        {
            var imageByteArray = new ImageByteArray(data, width, height, bytesChannel+2, channels);
        });
        
        Assert.Throws<ArgumentException>(() =>
        {
            var imageByteArray = new ImageByteArray(data, width-1, height, bytesChannel, 0);
        });
        
        Assert.Throws<ArgumentException>(() =>
        {
            var imageByteArray = new ImageByteArray(Array.Empty<byte>(), width, height, bytesChannel, channels);
        });
        
        var imageByteArray = new ImageByteArray(data, width, height, bytesChannel, channels);
        
        Assert.That(imageByteArray.Width, Is.EqualTo(width));
        Assert.That(imageByteArray.Height, Is.EqualTo(height));
        Assert.That(imageByteArray.BytesPerChannel, Is.EqualTo(bytesChannel));
        Assert.That(imageByteArray.NumChannels, Is.EqualTo(channels));
        Assert.That(imageByteArray, Is.Not.Null);
        Assert.That(imageByteArray.ImageData, Is.Not.Empty);
        Assert.That(imageByteArray.ImageData.Length, Is.EqualTo(width*height*bytesChannel*channels) );
        Assert.That(imageByteArray.Format, Is.EqualTo(DepthImageFormat.Rgb24bpp));
        
    }
    
    
}