namespace ReFlex.Core.Common.Util
{
    public static class DepthImageFormatTools
    {
        public static uint NumChannels(DepthImageFormat format)
        {
            switch (format)
            {
                case DepthImageFormat.Rgb24bpp:                    
                case DepthImageFormat.Greyccale48bpp:
                    return 3;
                case DepthImageFormat.Greyscale8bpp:
                    return 1;
                default:
                    return 1;
            }
        }

        public static uint BytesPerChannel(DepthImageFormat format)
        {
            switch (format)
            {
                case DepthImageFormat.Greyccale48bpp:
                    return 2;
                case DepthImageFormat.Rgb24bpp:
                case DepthImageFormat.Greyscale8bpp:
                default:
                    return 1;
            }
        }

        public static string GetFileExtension(DepthImageFormat format)
        {
            switch (format)
            {
                case DepthImageFormat.Greyccale48bpp:
                    return "png";
                case DepthImageFormat.Rgb24bpp:
                case DepthImageFormat.Greyscale8bpp:
                default:
                    return "jpg";
            }
        }
    }
}
