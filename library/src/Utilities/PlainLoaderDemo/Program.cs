using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using ReFlex.Sensor.AzureKinectModule;
using ReFlex.Sensor.EmulatorModule;
// using ReFlex.Sensor.Kinect2Module;
using ReFlex.Sensor.RealSenseD435Module;
using ReFlex.Sensor.RealSenseL515Module;
using ReFlex.Sensor.RealSenseR2Module;

namespace PlainLoaderDemo
{
    class Program
    {
        static void Main(string[] args)
        {
            var serviceProvider = new ServiceCollection();

            AddLibrary(GetEmulator, serviceProvider, CameraType.Emulator);

            AddLibrary(GetRealSenseD435, serviceProvider, CameraType.RealSenseD435);

            AddLibrary(GetRealSenseR2, serviceProvider, CameraType.RealSenseR2);

            AddLibrary(GetRealSenseL515, serviceProvider, CameraType.RealSenseL515);

            AddLibrary(GetAzureKinect, serviceProvider, CameraType.AzureKinect);
            
            // BadImageFormatException...
            // AddLibrary(GetKinect2, serviceProvider, CameraType.Kinect2);

            var services = serviceProvider.BuildServiceProvider();

            var cameras = services.GetServices<IDepthCamera>().Where(cam => cam != null).ToList();

            var cameraTypes = Enum.GetValues(typeof(CameraType)).Cast<CameraType>().ToList();

            cameraTypes.ForEach(camType => ReportCameraState(cameras, camType));

            var azureKinect = services.GetServices<IDepthCamera>()
                .FirstOrDefault(cam => cam.CameraType == CameraType.AzureKinect);

            if (azureKinect != null)
            {
                var isKinectAvailable = azureKinect.State == DepthCameraState.Connected;

                if (!isKinectAvailable)
                {
                    Console.Write("AzureKinect not connected...");
                    return;
                }

                var parameters = azureKinect.GetPossibleConfigurations();
                var highest = parameters.Last();

                Console.WriteLine($"trying to start {azureKinect.ModelDescription}[{azureKinect.Id}] with Depth resolution of {highest.Width} x {highest.Height} @ {highest.Framerate} FPS");

                azureKinect.EnableStream(highest);

                azureKinect.StartStream();

                Console.WriteLine($"azure kinect state: {azureKinect.State}");


                Console.WriteLine("Press any key to stop...");
                Console.ReadLine();

                azureKinect.StopStream();

                Console.WriteLine($"azure kinect state: {azureKinect.State}");
            }
        }

        private static void AddLibrary(Func<IServiceProvider, IDepthCamera> loader, IServiceCollection collection, CameraType type)
        {
            Console.WriteLine($"Creating {type}... ");

            try
            {
                collection.AddScoped(loader);
            }
            catch (Exception exc)
            {
                Console.WriteLine($"{exc.GetType().FullName} occurred when trying to load camera with {type}.");
                Console.WriteLine($"Message: {exc.Message}");
                Console.WriteLine($"Stacktrace: {exc.StackTrace}");
            }
        }

        private static IDepthCamera GetEmulator(IServiceProvider arg)
        {
            return new EmulatorCamera();
        }

        private static IDepthCamera GetRealSenseD435(IServiceProvider arg)
        {
            return new RealsenseD435Camera();
        }

        private static IDepthCamera GetRealSenseL515(IServiceProvider arg)
        {
            return new RealsenseL515Camera();
        }

        private static IDepthCamera GetRealSenseR2(IServiceProvider arg)
        {
            return new RealsenseR2Camera();
        }

        // private static IDepthCamera GetKinect2(IServiceProvider arg)
        // {
        //     try
        //     {
        //         return new Kinect2Camera();
        //     }
        //     catch (Exception exc)
        //     {
        //         Console.WriteLine($"{exc.GetType().FullName} occurred when trying to load Kinect 2 library.");
        //         Console.WriteLine($"Message: {exc.Message}");
        //         Console.WriteLine($"Stacktrace: {exc.StackTrace}");
        //     }
        //
        //     return null;
        // }

        private static IDepthCamera GetAzureKinect(IServiceProvider arg)
        {
            return new AzureKinectCamera();
        }

        private static void ReportCameraState(IEnumerable<IDepthCamera> deviceList, CameraType type)
        {
            var cam = deviceList.FirstOrDefault(dev => Equals(dev.CameraType, type));

            Console.WriteLine(GetLibLoadingState(cam, type));
            Console.WriteLine(GetDeviceStatus(cam));

            Console.WriteLine("       ...       ");
        }

        private static string GetLibLoadingState(IDepthCamera cam, CameraType type)
        {
            if (cam == null)
                return $"{type} could not be loaded";

            return $"{cam.ModelDescription} loaded.";
        }

        private static string GetDeviceStatus(IDepthCamera cam)
        {
            if (cam == null)
                return "no valid Camera instance";


            switch (cam.State)
            {
                case DepthCameraState.Error:
                    return $"{cam.ModelDescription} entered error state.";
                case DepthCameraState.Disconnected:
                    return $"{cam.ModelDescription} is not connected.";
                case DepthCameraState.Connected:
                    return $"{cam.ModelDescription} is connected.";
                case DepthCameraState.Streaming:
                    return $"{cam.ModelDescription} is streaming.";
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

    }
}