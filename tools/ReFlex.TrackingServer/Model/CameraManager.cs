using NLog;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Sensor.EmulatorModule;

using System.Runtime.InteropServices;
#if MS_AZURE_KINECT
using ReFlex.Sensor.AzureKinectModule;
#endif
#if MS_KINECT2
using ReFlex.Sensor.Kinect2Module;
#endif
#if INTEL_REALSENSE
using ReFlex.Sensor.RealSenseD435Module;
using ReFlex.Sensor.RealSenseL515Module;
using ReFlex.Sensor.RealSenseR2Module;
#endif

namespace TrackingServer.Model
{
    public class CameraManager
    {
        public static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly List<IDepthCamera> _depthCameras;

        public List<IDepthCamera> AvailableCameras => _depthCameras;

        public CameraManager()
        {
            _depthCameras = new List<IDepthCamera>();

#if INTEL_REALSENSE
            try
            {
                var realSenseR2 = new RealsenseR2Camera();
                _depthCameras.Add(realSenseR2);
                Logger.Info($"Successfully loaded {realSenseR2.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }
            
            try
            {
                var realSenseD435 = new RealsenseD435Camera();
                _depthCameras.Add(realSenseD435);
                Logger.Info($"Successfully loaded {realSenseD435.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            try
            {
                var realSenseL515 = new RealsenseL515Camera();
                _depthCameras.Add(realSenseL515);
                Logger.Info($"Successfully loaded {realSenseL515.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

#endif
#if MS_KINECT2

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) {

               try
               {
                   var kinect2 = new Kinect2Camera();
                   _depthCameras.Add(kinect2);
                   Logger.Info($"Successfully loaded {kinect2.ModelDescription} camera.");
               }
               catch (Exception exception)
               {
                   Logger.Error(exception);
               }

            }
#endif

#if MS_AZURE_KINECT

           try
            {
                var azureKinectCamera = new AzureKinectCamera();
                _depthCameras.Add(azureKinectCamera);
                Logger.Info($"Successfully loaded {azureKinectCamera.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

#endif

            try
            {
                var emulator = new EmulatorCamera("127.0.0.1", 40000, "/ReFlex");
                // var emulator = new EmulatorCamera();
                _depthCameras.Add(emulator);
                Logger.Info($"Successfully loaded {emulator.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            try
            {
                var imgBasedEumlator = new ImageBasedEmulatorCamera("/depthImageReceiver");
                _depthCameras.Add(imgBasedEumlator);
                Logger.Info($"Successfully loaded {imgBasedEumlator.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            try
            {
                var replay = new DepthStreamReplayCamera();
                _depthCameras.Add(replay);
                Logger.Info($"Successfully loaded {replay.ModelDescription} camera.");
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }
        }
    }
}