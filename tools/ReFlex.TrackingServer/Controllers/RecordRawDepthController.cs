using Implementation.Interfaces;
using Microsoft.AspNetCore.Mvc;
using ReFlex.Core.Common.Components;
using ServiceStack;
using NLog;
using ReFlex.Core.Tracking.Util;
using TrackingServer.Util.JsonFormats;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecordRawDepthController : ControllerBase
    {
        private readonly IDepthImageManager _depthImageMgr;
        private readonly IFilterManager _filterMgr;
        private static bool _isRecording;

        private const int NumSamples = 10;
        public const string SavePath = "wwwroot/measurements/";

        private static int _recordId = 0;
        private static int _sampleIdx = 0;

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public RecordRawDepthController(IDepthImageManager depthImgMgr, IFilterManager filterMgr)
        {
            _depthImageMgr = depthImgMgr;
            _filterMgr = filterMgr;
            _depthImageMgr.RawDepthFrameReceived += StartSaveSample;

            if (!Directory.Exists(SavePath))
            {
                Directory.CreateDirectory(SavePath);
            }
        }

        private async void StartSaveSample(object? sender, DepthCameraFrame e)
        {
            await SaveSample(e);
        }

        // GET: api/RecordRawDepth/IsCapturing
        [Route("IsCapturing")]
        [HttpGet]
        public bool IsCapturing() => _isRecording;

        // GET: api/RecordRawDepth/CurrentRecordId
        [Route("CurrentRecordId")]
        [HttpGet]
        public int CurrentRecordId() => _recordId;

        // GET: api/RecordRawDepth/CurrentSampleIdx
        [Route("CurrentSampleIdx")]
        [HttpGet]
        public int CurrentSampleIdx() => _sampleIdx;


        // PUT: api/RecordRawDepth/RecordSamples
        [HttpPut("RecordSamples")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonSimpleValue<int>> RecordSamples([FromBody]JsonSimpleValue<int> captureId)
        {
            if (!_isRecording) {
                _recordId = captureId.Value;
                _isRecording = true;
                var dir = $"{SavePath}{_recordId}";
                if (Directory.Exists(dir))
                {
                    Directory.Delete(dir, true);
                }

                Directory.CreateDirectory(dir);

                Logger.Info($"Started Recording with Id {_recordId} to directory {dir}");
            }

            return new ActionResult<JsonSimpleValue<int>>(new JsonSimpleValue<int>{ Name = "RecordId", Value = _recordId});
        }

        private async Task SaveSample(DepthCameraFrame e)
        {
            if (!_isRecording)
                return;

            ++_sampleIdx;

            var filter = _filterMgr.LimitationFilter;
            var pCloud = new PointCloud3(_depthImageMgr.ImageWidth, _depthImageMgr.ImageHeight);
            pCloud.Update(e.Depth, 0.0f);
            filter.Filter(e.Depth, pCloud);

            var rawData = pCloud.AsJaggedArray();

            var saveData = new List<Point3Indexed>();

            Logger.Debug($"Saving Depth image with {rawData.Length} cols.");

            for (var col = 0; col < rawData.Length; col++)
            {
                var lineData = new List<Point3Indexed>();
                var line = rawData[col];

                for (var row = 0; row < line.Length; row++)
                {
                    lineData.Add(new Point3Indexed(line[row], col, row));
                }

                saveData.AddRange(lineData);
            }

            await Save(_recordId, _sampleIdx, saveData);
            if (_sampleIdx >= NumSamples) {
                 _sampleIdx = 0;
                 _isRecording = false;

                 Logger.Info($"Completed Recording with Id {_recordId} to directory {SavePath}{_recordId} containing {NumSamples} depth image samples.");
            }
        }

        private static async Task<string> Save(int id, int idx, IList<Point3Indexed> rawDepthPoints)
        {
            var serialized = rawDepthPoints.ToCsv();

            var result = $"{SavePath}{id}/{idx}.csv";

            await using var writer = System.IO.File.CreateText(result);
            await writer.WriteAsync(serialized);

            return result;
        }
    }
}
