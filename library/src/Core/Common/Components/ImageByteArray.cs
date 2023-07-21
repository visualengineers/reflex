using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Components
{
    public class ImageByteArray
    {
       public byte[] ImageData { get; }

        public uint BytesPerChannel { get; }

        public int Width { get; }

        public int Height { get; }

        public DepthImageFormat Format { get; }

        public ImageByteArray(byte[] imageData, 
            int width, int height,
            uint bytesPerChannel, uint numChannels, 
            DepthImageFormat format = DepthImageFormat.Rgb24bpp)
        {
            ImageData = imageData;
            BytesPerChannel = bytesPerChannel;
            Width = width;
            Height = height;
            Format = format;
        }
    }
}