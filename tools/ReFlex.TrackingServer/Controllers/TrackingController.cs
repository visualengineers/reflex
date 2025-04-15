using Microsoft.AspNetCore.Mvc;
using NLog;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using ReFlex.Sensor.EmulatorModule;
using ReFlex.Server.Data.Config;
using ReFlex.Server.Data.Tracking;
using TrackingServer.Model;
using TrackingServer.Services;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;
using LogLevel = NLog.LogLevel;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrackingController : ControllerBase
    {
        private readonly TrackingService _trackingService;
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly DepthStreamRecorder _recorder;

        private readonly DepthImageService _depthImageService;
        private readonly ConfigurationManager _configManager;

        public TrackingController(TrackingService trackingService, DepthStreamRecorder recorder, DepthImageService depthImageService, ConfigurationManager configMgr )
        {
            _trackingService = trackingService;
            _recorder = recorder;
            _depthImageService = depthImageService;
            _configManager = configMgr;
        }

        // GET: api/Tracking
        [HttpGet]
        public IEnumerable<IDepthCamera> GetCameras() => _trackingService.GetCameras();

        // GET: api/Tracking/SelectedCamera
        [Route("SelectedCamera")]
        [HttpGet]
        public IDepthCamera GetSelectedCamera() => _trackingService.GetSelectedCamera();


        // GET: api/Tracking/SelectedCameraConfig
        [Route("SelectedCameraConfig")]
        [HttpGet]
        public StreamParameter GeSelectedCameraConfig() => _trackingService.GetSelectedCameraConfiguration();

        // GET: api/Tracking/Configurations/{id}
        [Route("Configurations/{id}")]
        [HttpGet]
        public IEnumerable<StreamParameter> GetConfigurations(int id) => _trackingService.GetConfigurations(id);

        // GET: api/Tracking/{id}
        [HttpGet("{id:int}", Name = "Get")]
        public IDepthCamera Get(int id) => _trackingService.GetCamera(id);

        // GET: api/Status
        [Route("Status")]
        [HttpGet]
        public TrackingConfigState GetStatus() => _trackingService.GetStatus();

        // PUT: api/Tracking/{id}
        [HttpPut("{id:int}")]
        public void SelectCamera(int id, [FromBody] string value)
        {
            _trackingService.SelectCameraById(id);
        }

        // PUT: api/Tracking/Configuration/{id}
        [Route("Configuration/{id:int}")]
        [HttpPut]
        public void SelectConfiguration(int id, [FromBody] string value)
        {
           _trackingService.SelectConfigurationById(id);
        }

        // PUT: api/Tracking/ToggleTracking
        [Route("ToggleTracking/{id:int}")]
        [HttpPut]
        public IActionResult ToggleTracking(int id, [FromBody] int configIdx)
        {
            _trackingService.ToggleTracking(id, configIdx);

            var cam = GetSelectedCamera().ModelDescription;
            var configList = GetConfigurations(id).ToList();
            if (configList.Count > configIdx)
            {
                var config = configList[configIdx];

                _configManager.Settings.DefaultCamera = cam;
                _configManager.Settings.CameraConfigurationValues = new CameraConfiguration
                {
                    Framerate = config.Framerate,
                    Width = config.Width,
                    Height = config.Height
                };
            }

            Logger.Info($"Updated TrackingState for {_trackingService.GetSelectedCamera().ModelDescription} to {_trackingService.GetStatus()} with Resolution {_trackingService.GetSelectedCameraConfiguration()}.");

            return new AcceptedResult();
        }

        // PUT: api/Tracking/SetDepthImagePreview/
        [Route("SetDepthImagePreview")]
        [HttpPut]
        public IActionResult SetDepthImagePreview([FromBody]bool status)
        {
            var updatedState = status ? _depthImageService.EnableRawDataStream() : _depthImageService.DisableRawDataStream();

            Logger.Info($"Updated SetDepthImagePreview to {updatedState}.");

            return new AcceptedResult();
        }

        // PUT: api/Tracking/SetDepthImagePointCloudPreview/
        [Route("SetDepthImagePointCloudPreview")]
        [HttpPut]
        public IActionResult SetDepthImagePointCloudPreview([FromBody]bool status)
        {
            var updatedState = status ? _depthImageService.EnablePointCloudStream() : _depthImageService.DisablePointCloudStream();

            Logger.Info($"Updated SetDepthImagePointCloudPreview to {updatedState}.");

            return new AcceptedResult();
        }


        // Get: api/Tracking/Recordings/
        [HttpGet("Recordings")]
        public async Task<ActionResult<List<StreamParameter>>> GetRecordingsList()
        {
            return await Task.Run(() => RecordingUtils.RetrieveConfigurations().ToList());
        }

        // Put: api/Tracking/StartRecording/
        [HttpPut("StartRecording")]
        public ActionResult<string> StartRecording([FromBody] string name)
        {
            if (!_trackingService.GetStatus().IsCameraSelected)
            {
                Logger.Log(LogLevel.Error, $"Cannot start recording: No Camera selected.");
                return Forbid("");
            }

            if (_trackingService.GetSelectedCamera().State != DepthCameraState.Streaming)
            {
                Logger.Log(LogLevel.Error, $"Cannot start recording: Selected Camera is not streaming data.");
                return Forbid("");
            }

            var result = _recorder.StartRecording(_trackingService.GetSelectedCamera(), name);

            return Ok(result);
        }

        // Get: api/Tracking/StopRecording/
        [HttpGet("StopRecording")]
        public async Task<ActionResult<string>> StopRecording()
        {
            var result = await _recorder.StopRecording();

            Logger.Log(LogLevel.Info, $"Stopped recoding: {result}.");

            return Ok(result);
        }

        // Put: api/Tracking/DeleteRecording/
        [HttpPut("DeleteRecording")]
        public ActionResult<bool> DeleteRecording([FromBody] string name)
        {
            // do not delete folder of current recording...
            if (_recorder.IsRecording && Equals(_recorder.SessionName))
            {
                Logger.Log(LogLevel.Error,
                    "Attempt to delete recording '{name}', but Recorder was still recording data. Recording was not deleted.");
                return Forbid();
            }

            var result = RecordingUtils.DeleteRecording(name);

            if (result)
                Logger.Log(LogLevel.Info, $"Sucessfully deleted recording '{name}'.");
            else
                Logger.Log(LogLevel.Error, $"Error when deleting recording '{name}'.");

            return Ok(result);

        }

        // Get: api/Tracking/ClearRecordings/
        [HttpGet("ClearRecordings")]
        public ActionResult<int> ClearRecordings()
        {
            if (_recorder.IsRecording)
            {
                Logger.Log(LogLevel.Error,
                    "Attempt to cleaning all recordings, while Recorder was still recodring. Cleaning was canceled.");
                return 0;
            }

            var result = RecordingUtils.DeleteAllRecordings();
            Logger.Log(LogLevel.Info, $"Deleted {result} recordings.");

            return Ok(result.ToString());
        }

        // Get: api/Tracking/RecordingState/
        [HttpGet("RecordingState")]
        public ActionResult<bool> RecordingState() => _recorder.IsRecording;


        // Get: api/Tracking/RecordingFrameCount/name
        [HttpGet("RecordingFrameCount/{name}")]
        public ActionResult<int> RecordingFrameCount(string name) => RecordingUtils.GetFrames(name).Length;

        // Get: api/Tracking/GetAutostartEnabled/
        [HttpGet("GetAutostartEnabled")]
        public ActionResult<bool> GetAutostartEnabled() => _configManager.Settings.IsAutoStartEnabled;

        // Put: api/Tracking/SetAutostart/
        [HttpPut("SetAutostart")]
        public ActionResult<bool> SetAutostart([FromBody] bool autostartEnabled)
        {
            _configManager.Settings.IsAutoStartEnabled = autostartEnabled;

            return Ok(_configManager.Settings.IsAutoStartEnabled);

        }


    }
}
