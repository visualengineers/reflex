using Implementation.Interfaces;
using Microsoft.AspNetCore.Builder;
using NLog;
using ReFlex.Core.Common.Components;
using System;
using System.Linq;
using System.Net.WebSockets;
using System.Reactive.Linq;
using System.Threading;
using System.Threading.Tasks;
using Graphics;
using Prism.Events;
using TrackingServer.Events;
using TrackingServer.Model;
using LogLevel = NLog.LogLevel;

namespace TrackingServer.Services
{
    public class DepthImageService
    {    
        private readonly IDepthImageManager _depthImageManager;

        private readonly IEventAggregator _eventAggregator;

        private static IObservable<ImageByteArray> _encodedRawData;
        
        private static IObservable<PointCloud3> _encodedPointCloud;

        private static bool streamDepthImage = false;
        
        private static bool streamPointCloud = false;

        private static Logger Logger = LogManager.GetCurrentClassLogger();

        public static float MinZ { get; set; } = 0.5f;
        
        public static float RangeZ { get; set; } = 1f;

        public bool EnableRawDataStream() {
            streamDepthImage = true;
            return streamDepthImage;
        }

        public bool DisableRawDataStream() {
            streamDepthImage = false;
            return streamDepthImage;
        }
        
        public bool EnablePointCloudStream() {
            streamPointCloud = true;
            return streamPointCloud;
        }

        public bool DisablePointCloudStream() {
            streamPointCloud = false;
            return streamPointCloud;
        }

        public DepthImageService(IDepthImageManager depthImageManager, IEventAggregator eventAggregator)
        {
            _eventAggregator = eventAggregator;
            _depthImageManager = depthImageManager;

            _eventAggregator.GetEvent<ServerSettingsUpdatedEvent>().Subscribe(
                settings =>
                {
                    MinZ = settings.FilterSettingValues.DistanceValue.Default - settings.FilterSettingValues.DistanceValue.Max;
                    RangeZ = 2.0f * settings.FilterSettingValues.DistanceValue.Max;
                });

            var depthImageObservable = Observable.FromEventPattern<ImageByteArray>(
                (handler) => _depthImageManager.DepthImageChanged += handler,
                (handler) => _depthImageManager.DepthImageChanged -= handler);
            
            var filteredPointCloudObservable = Observable.FromEventPattern<PointCloud3>(
                (handler) => _depthImageManager.PointcloudFiltered += handler,
                (handler) => _depthImageManager.PointcloudFiltered -= handler);

            _encodedRawData = depthImageObservable
                .Sample(TimeSpan.FromMilliseconds(100))
                .SkipWhile(evt => !streamDepthImage)
                .Select(evt => evt.EventArgs)
                .Publish()
                .RefCount();
            
            _encodedPointCloud = filteredPointCloudObservable
                .Sample(TimeSpan.FromMilliseconds(100))
                .SkipWhile(evt => !streamPointCloud)
                .Select(evt => evt.EventArgs)
                .Publish()
                .RefCount();
        }

        /// <summary>
        /// Awaits next depth image event, converts byte array to image and encodes this to jpg
        /// method waits for a response to send the next frame. 
        /// </summary>
        /// <param name="webSocket"></param>
        /// <returns></returns>
        public async Task StreamRawData(WebSocket webSocket)
        {
            var buffer = new byte[4096 * 10];
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            while (!result.CloseStatus.HasValue)
            {
                try
                {
                    var streamedImageData = await _encodedRawData.FirstAsync();

                    var sendImage = await StreamDataConverter.ConvertRawBytesToJpeg(streamedImageData);
                    
                    var modifiedData = StreamDataConverter.EncodeImageData(sendImage, "data:image/jpeg;base64,");
                    
                    await webSocket.SendAsync(new ArraySegment<byte>(modifiedData, 0, modifiedData.Length), result.MessageType, result.EndOfMessage, CancellationToken.None);
                }
                catch (Exception exc)
                {
                    Logger.Log(LogLevel.Error, exc, $"{exc.GetType().Name} when streaming depthImage in {GetType().Name}: {exc.Message}");
                    await webSocket.SendAsync(new ArraySegment<byte>(), result.MessageType, result.EndOfMessage, CancellationToken.None);
                }
                finally 
                { 
                    var outputData = new ArraySegment<byte>(buffer);
                    result = await webSocket.ReceiveAsync(outputData, CancellationToken.None);
                }
                
            }
            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }
        
        /// <summary>
        /// Awaits next point cloud filtered event, converts byte array to image and encodes this to jpg
        /// method waits for a response to send the next frame. 
        /// </summary>
        /// <param name="webSocket"></param>
        /// <returns></returns>
        public async Task StreamPointCloud(WebSocket webSocket)
        {
            var buffer = new byte[4096 * 10];
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            while (!result.CloseStatus.HasValue)
            {
                try
                {
                    var pCloud = await _encodedPointCloud.FirstAsync();
                    var span = pCloud.AsMemory();

                    var converted = new byte[pCloud.Size * 3].AsMemory();

                    for (var i = 0; i < pCloud.Size; i++)
                    {
                        byte z = 127;
                        var point = span.Span[i];
                        if (point.IsValid && !point.IsFiltered)
                        {
                            z = Convert.ToByte(Math.Clamp((point.Z - MinZ) / RangeZ, 0.0, 1.0) * 255);
                        }

                        converted.Span[i * 3] = z;
                        converted.Span[i * 3 + 1] = z;
                        converted.Span[i * 3 + 2] = z; ;
                    }

                    var imageData = new ImageByteArray(converted.ToArray(), pCloud.SizeX, pCloud.SizeY, 1, 3);

                    var sendImage = await StreamDataConverter.ConvertRawBytesToJpeg(imageData);
                    
                    var modifiedData = StreamDataConverter.EncodeImageData(sendImage, "data:image/jpeg;base64,");
                    
                    await webSocket.SendAsync(new ArraySegment<byte>(modifiedData, 0, modifiedData.Length), result.MessageType, result.EndOfMessage, CancellationToken.None);
                }
                catch (Exception exc)
                {
                    Logger.Log(LogLevel.Error, exc, $"{exc.GetType().Name} when streaming depthImage in {GetType().Name}: {exc.Message}");
                    await webSocket.SendAsync(new ArraySegment<byte>(), result.MessageType, result.EndOfMessage, CancellationToken.None);
                }
                finally 
                { 
                    var outputData = new ArraySegment<byte>(buffer);
                    result = await webSocket.ReceiveAsync(outputData, CancellationToken.None);
                }
                
            }
            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }

    }
}
