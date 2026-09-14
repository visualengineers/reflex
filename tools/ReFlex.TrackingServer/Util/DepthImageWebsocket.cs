using TrackingServer.Services;

namespace TrackingServer.Util
{

    /// <summary>
    /// Reference Implementation: https://github.com/ardacetinkaya/WebCam-Streaming
    /// </summary>
    public static class DepthImageWebsocket
    {
        public static DepthImageService? StreamingInstance {get; private set; }

        public static IApplicationBuilder UseStreamSocket(this IApplicationBuilder app)
        {

            StreamingInstance = app.ApplicationServices.GetService(typeof(DepthImageService)) as DepthImageService;

            app.Use(async (context, next) =>
            {
                if (context.Request.Path == "/depthImage")
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        if (StreamingInstance != null)
                          await StreamingInstance.StreamRawData(webSocket);
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                    }
                }
                else if (context.Request.Path == "/depthImagePointCloud")
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        if (StreamingInstance != null)
                          await StreamingInstance.StreamPointCloud(webSocket);
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
    }
}
