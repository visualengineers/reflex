using Implementation.Interfaces;
using NLog;
using ReFlex.Core.Common.Components;
using System.Net.WebSockets;
using System.Reactive.Linq;
using Graphics;
using TrackingServer.Events;
using LogLevel = NLog.LogLevel;
using Math = System.Math;

namespace TrackingServer.Services
{
    public class DepthImageService
    {
        private readonly IDepthImageManager _depthImageManager;

        private readonly IEventAggregator _eventAggregator;

        private static IObservable<ImageByteArray>? _encodedRawData;

        private static IObservable<PointCloud3>? _encodedPointCloud;

        private static bool _streamDepthImage;

        private static bool _streamPointCloud;

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public static float MinZ { get; set; } = 0.5f;

        public static float RangeZ { get; set; } = 1f;

        public bool EnableRawDataStream() {
            _streamDepthImage = true;
            return _streamDepthImage;
        }

        public bool DisableRawDataStream() {
            _streamDepthImage = false;
            return _streamDepthImage;
        }

        public bool EnablePointCloudStream() {
            _streamPointCloud = true;
            return _streamPointCloud;
        }

        public bool DisablePointCloudStream() {
            _streamPointCloud = false;
            return _streamPointCloud;
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
                .SkipWhile(_ => !_streamDepthImage)
                .Select(evt => evt.EventArgs)
                .Publish()
                .RefCount();

            _encodedPointCloud = filteredPointCloudObservable
                .Sample(TimeSpan.FromMilliseconds(100))
                .SkipWhile(_ => !_streamPointCloud)
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
                  if (_encodedRawData == null)
                    continue;
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
                  if (_encodedPointCloud == null)
                    continue;

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
                    converted.Span[i * 3 + 2] = z;
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
