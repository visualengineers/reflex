using System;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Components
{
    public class ImageByteArray
    {
        /// <summary>
        /// Initializes all class members
        /// </summary>
        /// <param name="imageData">byte data containing the image. Must not be null and has to be of sufficient size (width x height x bytesPerChannel x numChannels>)</param>
        /// <param name="width">the width of the image in pixel</param>
        /// <param name="height">the height od the image in pixel</param>
        /// <param name="bytesPerChannel">the number of bytes used per color channel</param>
        /// <param name="numChannels">the number of channels used</param>
        /// <param name="format"><see cref="DepthImageFormat"/> for encoding / decoding</param>
        /// <exception cref="NullReferenceException">if imageData is null</exception>
        /// <exception cref="ArgumentException">if size of imageData is incorrect</exception>
        public ImageByteArray(byte[] imageData,
            int width, int height,
            uint bytesPerChannel, uint numChannels,
            DepthImageFormat format = DepthImageFormat.Rgb24bpp)
        {
            if (imageData == null)
                throw new NullReferenceException($"Provided value for {nameof(imageData)} must not be null.");

            if (imageData.Length != width * height * bytesPerChannel * numChannels)
                throw new ArgumentException(
                    $"Wrong size of {nameof(imageData)}: provided size of {imageData.Length} does not meet the required size (Width: {width} x Height: {height} x Bytes per channel: {bytesPerChannel} x NumChannels: {numChannels} = {width * height * bytesPerChannel}).");

            ImageData = imageData;
            BytesPerChannel = bytesPerChannel;
            NumChannels = numChannels;
            Width = width;
            Height = height;
            Format = format;
        }

        /// <summary>
        ///     Array containing the image data as bytes. Array is assigned in constructor and has the size <see cref="Width" /> x
        ///     <see cref="Height" /> x <see cref="BytesPerChannel" />.
        /// </summary>
        public byte[] ImageData { get; }

        /// <summary>
        /// Number of bytes used for each color channell
        /// </summary>
        public uint BytesPerChannel { get; }
        
        /// <summary>
        /// Number of color channels
        /// </summary>
        public uint NumChannels { get; }

        /// <summary>
        /// Width of the image in Pixel
        /// </summary>
        public int Width { get; }

        /// <summary>
        /// Height of the image in Pixel
        /// </summary>
        public int Height { get; }

        /// <summary>
        /// <see cref="DepthImageFormat"/> for encoding / decoding
        /// </summary>
        public DepthImageFormat Format { get; }
    }
}