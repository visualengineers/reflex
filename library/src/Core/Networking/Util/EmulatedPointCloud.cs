using System;
using System.Collections.Generic;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using Math = System.Math;
using System.Threading.Tasks;

namespace ReFlex.Core.Networking.Util
{
    public class EmulatedPointCloud
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private StreamParameter _currentParams;
        private readonly EmulatorParameters _emulatorParameters;
        private readonly float _pushRange;
        private readonly float _pullRange;

        private byte[] _image;        

        private uint _numChannels;
        private uint _bytesPerChannel;
        public uint MaxDepthImageValue { get => 255 * _bytesPerChannel; }

        public Point3[] Points { get; private set; }

        public bool GenerateDepthImage {get; set; } = true;

        public EmulatedPointCloud(EmulatorParameters param)
        {
            _emulatorParameters = param;
            _pushRange = _emulatorParameters.PlaneDistanceInMeter - _emulatorParameters.MinDepthInMeter;
            _pullRange = _emulatorParameters.MaxDepthInMeter - _emulatorParameters.PlaneDistanceInMeter;
        }

        public void InitializePointCloud(StreamParameter param)
        {
            if (param == null)
            {
                Logger.Error("Invalid parameter for intializatoin of point cloud.");
                return;
            } 

            _bytesPerChannel = DepthImageFormatTools.BytesPerChannel(param.Format);
            _numChannels = DepthImageFormatTools.NumChannels(param.Format);
            var defaultValue = GetImageDefaultValue();

            _currentParams = param;
            
            var result = new Point3[param.Width * param.Height].AsSpan<Point3>();
            _image = new byte[param.Width * param.Height * _bytesPerChannel * _numChannels];

            var xOffset = _emulatorParameters.WidthInMeters / param.Width;
            var yOffset = _emulatorParameters.HeightInMeters / param.Height;

            var xMin = 0 -_emulatorParameters.WidthInMeters * 0.5f;
            var yMin = 0 -_emulatorParameters.HeightInMeters * 0.5f;            

            for (var x = 0; x < param.Width; ++x)
            {
                var xPos = xMin + (xOffset * x);
                
                for (var y = 0; y < param.Height; ++y)
                {                    
                    var yPos = yMin + (yOffset * y);

                    var idx = ComputeIndex(x, y);

                    result[idx] = new Point3(xPos, yPos, _emulatorParameters.PlaneDistanceInMeter);

                    SetDepthImageValue(defaultValue, idx);
                }
            }

            Points = result.ToArray();
        }

        public void Reset()
        {
            var defaultValue = GetImageDefaultValue();

            for (int i = 0; i < Points.Length; ++i)
            {
                Points[i].Z = _emulatorParameters.PlaneDistanceInMeter;

                if (GenerateDepthImage)
                    SetDepthImageValue(defaultValue, i);
            }
        }

        public void UpdateFromInteractions(List<Interaction> interactions)
        {
            var squaredRadius = _emulatorParameters.Radius * _emulatorParameters.Radius;
            var depthImageDefaultValue = GetImageDefaultValue();

            for (var i = 0; i < interactions.Count; ++i)
            {
                var interaction = interactions[i];

                var centerX = (int)interaction.Position.X;
                var centerY = (int)interaction.Position.Y;

                var offset = interaction.Position.Z < 0 ? interaction.Position.Z * _pushRange : interaction.Position.Z * _pullRange;

                var depthImageValuePeak = interaction.Position.Z < 0 ? 0 : MaxDepthImageValue;                

                var radius = (int) Math.Abs(Math.Round(_emulatorParameters.Radius * offset));

                for (var x = -radius; x < radius; ++x)
                {
                    for (var y = -radius; y < radius; ++y)
                    {
                       var idx = ComputeIndex(centerX + x, centerY + y);

                        if (x == 0 && y == 0)
                        {
                            Points[idx].Z = _emulatorParameters.PlaneDistanceInMeter + offset;

                            if (GenerateDepthImage)
                                SetDepthImageValue(depthImageValuePeak, idx);
                            continue;
                        }

                        var dist = Math.Sqrt( x * x + y * y);

                        var maxDist = Math.Sqrt(2f * radius * radius);

                        var smooth = (float) Math.Sqrt(dist/maxDist);

                        if (dist < squaredRadius)
                        {
                            var factor = 1.0f - smooth;

                            var centerZ = _emulatorParameters.PlaneDistanceInMeter + (offset * factor);

                            Points[idx].Z = centerZ;

                            if (GenerateDepthImage) {
                                var factorDepthImage = factor * depthImageDefaultValue;
                                var depthImageValue = interaction.Position.Z < 0 ? (byte) (depthImageDefaultValue - factorDepthImage) : (byte) (depthImageDefaultValue + factorDepthImage);
                                SetDepthImageValue(depthImageValue, idx);
                            }
                        }
                    }
                }
            }            
        }

        public void UpdateFromGreyScaleImage(ImageByteArray imageData)
        {
            if (imageData.ImageData.Length < imageData.Width * imageData.Height * imageData.BytesPerChannel * _numChannels)
            {
                Logger.Log(LogLevel.Error, $"Incorrect Size for image data: Size of Byte Array: {imageData.ImageData.Length}, Image Dimensions (W x H x bpp): {imageData.Width} x {imageData.Height} x {imageData.BytesPerChannel}bpp.");
                return;
            }

            var defaultDepth = GetImageDefaultValue();

            // compute global offset - center of the plane is in the origin 
            var xMin = -_emulatorParameters.WidthInMeters * 0.5f;
            var yMin = -_emulatorParameters.HeightInMeters * 0.5f;

            // compute offset per pixel
            var pxOffsetX = _emulatorParameters.WidthInMeters / _currentParams.Width;
            var pxOffsetY = _emulatorParameters.HeightInMeters / _currentParams.Height;

            var iterationStep = _numChannels * _bytesPerChannel;

            for (uint i = 0; i < imageData.ImageData.Length; i+=iterationStep)
            {
                var zIdx = i + ((_numChannels - 1) * _bytesPerChannel);
                
                var dist = (int) imageData.ImageData[zIdx];

                if (_bytesPerChannel == 2)
                {
                    dist = Combine(imageData.ImageData[zIdx], imageData.ImageData[zIdx + 1]);
                }

                // skip all values that are on the normal plane (== 127)
                if (dist == defaultDepth)
                    continue;

                // 3 channels --> divide
                var pos = i / (iterationStep);

                // compute pixel index
                var xPx = pos % _currentParams.Width;
                var yPx = pos / _currentParams.Width;

                var x = xMin + (xPx * pxOffsetX);
                var y = yMin + (yPx * pxOffsetY);

                var valueRange = 127f * _bytesPerChannel;

                var z = dist < defaultDepth

                    // push: normalized depth * push range + min depth
                    ? (dist / (valueRange)) * _pushRange + _emulatorParameters.MinDepthInMeter

                    // pull: subtract push range, normalize depth behind plane * pull range + plane distance 
                    : ((dist - valueRange) / valueRange) * _pullRange + _emulatorParameters.PlaneDistanceInMeter;

                    
                Points[pos] = new Point3(x, y, z);
            }
        }

        public int ComputeIndex(int x, int y)
        {
            if (x < 0 || x >= _currentParams.Width || y < 0 || y >= _currentParams.Height)
                return 0;

            return y * _currentParams.Width + x;
        }

        public ImageByteArray GetUpdatedDepthImage()
        {
            return _image == null 
                ? new ImageByteArray(new byte[1],1,1, 1, 1, DepthImageFormat.Greyscale8bpp) 
                : new ImageByteArray(_image, _currentParams.Width, _currentParams.Height, _bytesPerChannel, _numChannels);
        }

        private uint GetImageDefaultValue()
        {
            // divide by 2: shifting bytes to the right
            return (MaxDepthImageValue >> 1) * _bytesPerChannel;
        }

        private void SetDepthImageValue(uint value, int index)
        {
            var bytes = BitConverter.GetBytes(value);

            for (var n = 0; n < _numChannels; n++)
                for (var b = 0; b < _bytesPerChannel; b++)
                    _image[index * _numChannels + n + b] = bytes[0];
        }
        
        private static int Combine(byte b1, byte b2)
        {
            // return b1 << 8 | b2;
            return b1 | (b2 << 8);
        }
    }
}
