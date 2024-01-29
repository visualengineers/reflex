using System;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace ReFlex.Sensor.EmulatorModule
{
    public class DepthStreamRecorder
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private IDepthCamera _recordingCamera;

        private string _sessionDir;

        private StreamParameter _sessionParams;

        private string _extension;

        public string SessionName { get; private set; }

        public bool IsRecording { get; private set; }

        public uint FrameId = 0;

        public event EventHandler<RecordingStateUpdate> RecordingStateUpdated;

        public string StartRecording(IDepthCamera camera, string name)
        {
            if (IsRecording)
            {
                Logger.Log(LogLevel.Warn, $"Already recording from {_recordingCamera?.ModelDescription} with Config {_recordingCamera?.StreamParameter?.Description}. Cannot start another recording session.");
                return "";
            }

            _recordingCamera = camera;

            // delete recording with existing name
            if (RecordingUtils.DeleteRecording(name))
                Logger.Warn($"Existing Recording with name '{name}' has been deleted.");

            var date = $"{DateTime.Now:yyyy-MM-dd_HH-mm-ss}";

            var dir = Directory.CreateDirectory($"{RecordingUtils.SavePath}{date}");

            _sessionDir = dir.FullName;
            _sessionParams = new StreamParameter(_recordingCamera.StreamParameter.Width, _recordingCamera.StreamParameter.Height, _recordingCamera.StreamParameter.Framerate, _recordingCamera.StreamParameter.Format, name);
            _extension = DepthImageFormatTools.GetFileExtension(_recordingCamera.StreamParameter.Format);

            _recordingCamera.DepthImageReady += SaveImage;

            Logger.Log(LogLevel.Info, $"Start recording from {_recordingCamera?.ModelDescription} with Config {_recordingCamera?.StreamParameter?.Description}.");

            IsRecording = true;

            SessionName = name;

            RecordingStateUpdated?.Invoke(this, new RecordingStateUpdate(RecordingState.Recording, (int)FrameId, SessionName));

            var result = JsonConvert.SerializeObject(_sessionParams);

            using (var writer = File.CreateText($"{_sessionDir}/{RecordingUtils.ConfigFile}"))
            {
                writer.WriteAsync(result);
            }

            return _sessionDir;
        }

        public async Task<string> StopRecording()
        {
            if (!IsRecording)
                return "";

            if (_recordingCamera == null)
            {
                Logger.Log(LogLevel.Error, $"Cannot {nameof(StopRecording)} for {GetType().Name}: No valid Camera set for recording.");
                return "";
            }
            
            _recordingCamera.DepthImageReady -= SaveImage;
            Logger.Log(LogLevel.Info, $"Successfully Recorded {FrameId + 1} frames from {_recordingCamera?.ModelDescription} with Config {_recordingCamera?.StreamParameter?.Description}");

            IsRecording = false;
            
            RecordingStateUpdated?.Invoke(this, new RecordingStateUpdate(RecordingState.Stopped, (int) FrameId, SessionName));

            FrameId = 0;

            return await Task.Run(() => JsonConvert.SerializeObject(_sessionParams));
        }

        

        private void SaveImage(object sender, ImageByteArray cameraData)
        {
            var id = $"{FrameId:0000000}";

            FrameId += 1;

            var fileName = $"{_sessionDir}/{id}.{_extension}";

            

            Task.Run(async () => {

                switch (cameraData.Format)
                {
                    case DepthImageFormat.Greyccale48bpp:
                        await SaveAsync<Rgb48>(fileName, cameraData);
                        break;
                    case DepthImageFormat.Greyscale8bpp:
                        await SaveAsync<L8>(fileName, cameraData);
                        break;
                    case DepthImageFormat.Rgb24bpp:                                           
                    default:
                        await SaveAsync<Rgb24>(fileName, cameraData);
                        break;
                }
            });
        }

        private async Task<bool> SaveAsync<T>(string fileName, ImageByteArray cameraData) where T: unmanaged, IPixel<T>
        {
            try
            {
                using (var image =
                    Image.LoadPixelData<T>(cameraData.ImageData, cameraData.Width, cameraData.Height))
                {
                    await Task.Run(() => {

                        if (fileName.EndsWith(".png"))
                            image.SaveAsPng(fileName);
                        else
                            image.SaveAsJpeg(fileName);
                        });
                    RecordingStateUpdated?.Invoke(this, new RecordingStateUpdate(RecordingState.Recording, (int)FrameId, SessionName));
                }
            }
            catch (Exception e)
            {
                Logger.Log(LogLevel.Error, e, $"{e.GetType().Name} when saving Image to {fileName}: {e.Message}");
                RecordingStateUpdated?.Invoke(this, new RecordingStateUpdate(RecordingState.Faulted, (int)FrameId, SessionName));

                return false;
            }

            return true;
        }
    }
}
