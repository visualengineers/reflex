using System.Net.Mime;
using Microsoft.AspNetCore.Mvc;
using NLog;
using ReFlex.Core.Common.Util;
using ReFlex.Server.Data.Config;
using TrackingServer.Events;
using TrackingServer.Model;
using TrackingServer.Util.JsonFormats;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;
using Logger = NLog.Logger;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProcessingController : ControllerBase
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly ProcessingService _service;
        private readonly ConfigurationManager _configManager;
        private readonly IEventAggregator _eventAggregator;

        public ProcessingController(ProcessingService service, ConfigurationManager configMgr, IEventAggregator eventAggregator)
        {
            _service = service;
            _configManager = configMgr;
            _eventAggregator = eventAggregator;
        }

        // GET: api/Processing/IsLoopRunning
        [Route("IsLoopRunning")]
        [HttpGet]
        public ActionResult<JsonSimpleValue<bool>> IsLoopRunning() => new(
            new JsonSimpleValue<bool> {
                Name = "IsLoopRunning", Value = _service.IsLoopRunning
            });

        // GET: api/Processing/GetInterval
        [Route("GetInterval")]
        [HttpGet]
        public int GetInterval() => _service.Interval;

        // GET: api/Processing/GetRemoteProcessorSettings
        [Route("GetRemoteProcessorSettings")]
        [HttpGet]
        public RemoteProcessingServiceSettings GetRemoteProcessorSettings() => _configManager?.Settings?.RemoteProcessingServiceSettingsValues ?? new RemoteProcessingServiceSettings();

        // GET: api/Processing/GetObserverType
        [Route("GetObserverType")]
        [HttpGet]
        public uint GetObserverType() => (uint) _service.ObserverType;

        // GET: api/Processing/GetObserverTypes
        [Route("GetObserverTypes")]
        [HttpGet]
        public IEnumerable<string> GetObserverTypes() => Enum.GetNames(typeof(ObserverType));

        // PUT: api/Processing/SetUpdateInterval/
        [HttpPost("SetUpdateInterval")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<int>> SetUpdateInterval([FromBody]JsonSimpleValue<int> ms)
        {
            var isValid = JsonSimpleValue<int>.ValidateArguments(ms, "UpdateInterval",
                $"{nameof(ProcessingController)}.{nameof(SetUpdateInterval)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);

            _service.Interval = ms.Value;
            _configManager.Settings.ProcessingSettingValues.IntervalDuration = ms.Value;

            Logger.Info($"Updated Interval for interaction prcoessing to {ms.Value}ms by {typeof(ProcessingController).FullName}.");

            return new ActionResult<JsonSimpleValue<int>>(ms);
        }

        // PUT: api/Processing/SetRemoteProcessorSettings/
        [HttpPost("SetRemoteProcessorSettings")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<RemoteProcessingServiceSettings> SetRemoteProcessorSettings([FromBody]RemoteProcessingServiceSettings settings)
        {
            var isValid = settings != null;

            if (!isValid)
                return BadRequest($"Invalid value for {typeof(RemoteProcessingServiceSettings).FullName} provided.");

            _eventAggregator.GetEvent<RemoteProcessingSettingsChangedEvent>().Publish(settings);
            // TODO: do not update settings directly but by subscribing to event
            _configManager.Settings.RemoteProcessingServiceSettingsValues = settings;

            Logger.Info($"Updated settings for remote interaction prcoessing to {settings.GetRemoteProcessingServiceSettingsString()}ms by {typeof(ProcessingController).FullName}.");

            return new ActionResult<RemoteProcessingServiceSettings>(settings);
        }

        // PUT: api/Processing/SelectObserverType
        [HttpPost("SelectObserverType")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SelectObserverType([FromBody]JsonSimpleValue<string> typeValue)
        {

            var isValid = JsonSimpleValue<string>.ValidateArguments(typeValue, "ObserverType",
                $"{nameof(ProcessingController)}.{nameof(SelectObserverType)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);

            var success = Enum.TryParse<ObserverType>(typeValue.Value, out var type);

            if (!success)
            {
                var msg =
                    $"Failed to switch {nameof(ObserverType)} by {typeof(ProcessingController).FullName}. Parse Error - {typeValue.Value} is not a valid value of {nameof(ObserverType)}.";
                Logger.Error(msg);
                return StatusCode(StatusCodes.Status500InternalServerError, msg);

            }

            if (_service.IsLoopRunning)
                ToggleInteractionProcessing();

            _service.ObserverType = type;
            _configManager.Settings.ProcessingSettingValues.InteractionType = type;

            var currentType = GetObserverType();

            if (currentType == (uint)type)
                Logger.Info($"Successfully Switched {nameof(ObserverType)} to {type} by {typeof(ProcessingController).FullName}.");
            else
                Logger.Error($"Failed to switch {nameof(ObserverType)} by {typeof(ProcessingController).FullName}. Parse Error - {type} is not a valid value of {nameof(ObserverType)}.");

            return new ActionResult<JsonSimpleValue<string>>(typeValue);
        }

        // PUT: api/Processing/ToggleInteractionProcessing
        [HttpPut("ToggleInteractionProcessing")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonSimpleValue<bool>> ToggleInteractionProcessing()
        {
            _service.IsLoopRunning = !_service.IsLoopRunning;

            Logger.Info($"Interaction Processing {(_service.IsLoopRunning ? "started" : "stopped")} by {typeof(ProcessingController).FullName}.");

            return new ActionResult<JsonSimpleValue<bool>>(new JsonSimpleValue<bool>{ Name = "IsProcessing", Value = _service.IsLoopRunning});
        }
    }
}
