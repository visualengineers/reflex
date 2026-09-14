using System;
using System.IO;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace Graphics
{
    public class StreamDataConverter
    {
        public static byte[] ConvertJpegToRawBytes(byte[] imageData, int targetWidth, int targetHeight, DepthImageFormat sourceFormat, bool convertBlackWhite = false)
        {
            switch (sourceFormat)
            {                
                case DepthImageFormat.Greyccale48bpp:
                    return ConvertJpegToRawBytes<Rgb48>(imageData, targetWidth, targetHeight, convertBlackWhite);
                case DepthImageFormat.Greyscale8bpp:
                    return ConvertJpegToRawBytes<L8>(imageData, targetWidth, targetHeight, convertBlackWhite);
                case DepthImageFormat.Rgb24bpp:
                default:
                    return ConvertJpegToRawBytes<Rgb24>(imageData, targetWidth, targetHeight, convertBlackWhite);
            }
        }

        public static byte[] ConvertJpegToRawBytes<T>(byte[] imageData, int targetWidth, int targetHeight, bool convertBlackWhite = false) where T : unmanaged, IPixel<T>
        {
            using (var ms1 = new MemoryStream(imageData))
            using (var image = Image.Load<T>(ms1))
            {
                var options = new ResizeOptions
                {
                    Mode = ResizeMode.Crop,
                    Size = new Size(targetWidth, targetHeight),
                    Position = AnchorPositionMode.TopLeft
                };                
                image.Mutate(c => c.Resize(options));                
                if (convertBlackWhite)
                    image.Mutate(c => c.BlackWhite());

                var result = new byte[image.Width * image.Height * Unsafe.SizeOf<Rgba32>()];
                image.CopyPixelDataTo(result);

                return result;
            }
        }
        
        /// <summary>
        /// @TODO: check if more conversions are possible: https://docs.sixlabors.com/api/ImageSharp/SixLabors.ImageSharp.PixelFormats.html#structs
        /// </summary>
        /// <param name="cameraData"></param>
        /// <returns></returns>
        public static async Task<byte[]> ConvertRawBytesToJpeg(ImageByteArray cameraData)
        {

            switch (cameraData.Format)
            {
                case DepthImageFormat.Greyccale48bpp:
                    return await ConvertRawBytesToJpeg<Rgb48>(cameraData);
                case DepthImageFormat.Greyscale8bpp:
                    return await ConvertRawBytesToJpeg<L8>(cameraData); 
                case DepthImageFormat.Rgb24bpp:
                default:
                    return await ConvertRawBytesToJpeg<Rgb24>(cameraData);
            }
        }

        public static async Task<byte[]> ConvertRawBytesToJpeg<T>(ImageByteArray cameraData) where T: unmanaged, IPixel<T>
        {
            byte[] sendImage;

            return await Task.Run(() =>
            {

                using (var ms1 = new MemoryStream(cameraData.ImageData))
                {
                    using (var image = Image.LoadPixelData<T>(ms1.ToArray(), cameraData.Width, cameraData.Height))
                    using (var ms2 = new MemoryStream())
                    {
                        //var file = DepthImageFormatTools.GetFileExtension(cameraData.Format);
                        //if (file.EndsWith("png"))
                        //    image.SaveAsPng(ms2);
                        //else
                        image.SaveAsJpeg(ms2);

                        sendImage = ms2.ToArray();
                    }
                }

                return sendImage;
            });
        }

        public static byte[] DecodeImageData(byte[] streamData, string prefixToRemove)
        {
            var data = Encoding.UTF8.GetString(streamData);

            data = data.Replace(prefixToRemove, "");
            return Convert.FromBase64String(data);
        }

        public static byte[] EncodeImageData(byte[] rawData, string prefix)
        {
            var base64StringResult = Convert.ToBase64String(rawData);
            return Encoding.UTF8.GetBytes($"{prefix}{base64StringResult}");
        }
    }
}
