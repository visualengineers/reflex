using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using ReFlex.Sensor.EmulatorModule;
using System;
using System.Linq;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using Graphics;
using Microsoft.Extensions.DependencyInjection;
using NLog;
using ReFlex.Core.Tracking.Util;
using TrackingServer.Model;
using ReFlex.Core.Common.Util;
using LogLevel = NLog.LogLevel;

namespace TrackingServer.Util
{
    /// <summary>
    /// Reference Implementation: https://github.com/ardacetinkaya/WebCam-Streaming
    /// </summary>
    public static class DepthImageReceiver
    {
        private static ImageBasedEmulatorCamera Camera;

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public static IApplicationBuilder UseDepthImageReceiverSocket(this IApplicationBuilder app)
        {
            RetrieveCamera(app);

            app.Use(async (context, next) =>
            {
                if (Camera == null)
                {
                    var success = RetrieveCamera(app);
                    if (!success)
                        await next();
                }

                if (context.Request.Path == Camera.Id)
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        await ReceiveCameraImages(context, webSocket);
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                    }
                }
                else
                {
                    await next();
                }

            });

            return app;
        }

        private static bool RetrieveCamera(IApplicationBuilder app)
        {
            Camera = app.ApplicationServices.GetService<CameraManager>()?.AvailableCameras?.FirstOrDefault(cam => cam.GetType() == typeof(ImageBasedEmulatorCamera)) as ImageBasedEmulatorCamera;

            if (Camera != null)
                return true;

            Logger.Log(LogLevel.Error,
                $"Cannot retrieve {typeof(ImageBasedEmulatorCamera).FullName} from {typeof(CameraManager).FullName}.");

            return false;

        }

        private static async Task ReceiveCameraImages(HttpContext context, WebSocket webSocket)
        {
            var buffer = new byte[4096 * 10];
            WebSocketReceiveResult result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            while (!result.CloseStatus.HasValue && Camera?.State == DepthCameraState.Streaming)
            {
                try
                {
                    var streamData = new ArraySegment<byte>(buffer, 0, result.Count);

                    var imageData = StreamDataConverter.DecodeImageData(streamData.ToArray(), "data:image/jpeg;base64,");

                    Camera.Update(StreamDataConverter.ConvertJpegToRawBytes(imageData, Camera.StreamParameter.Width, Camera.StreamParameter.Height, DepthImageFormat.Rgb24bpp));
                }
                catch (Exception exc)
                {
                    Logger.Log(LogLevel.Error, exc, $"Cannot convert image: ${exc.GetType().Name}:{exc.Message}");
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
