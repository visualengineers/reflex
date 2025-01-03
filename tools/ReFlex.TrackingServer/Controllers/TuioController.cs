using System.Net.Mime;
using Microsoft.AspNetCore.Mvc;
using NLog;
using ReFlex.Core.Tuio.Util;
using TrackingServer.Model;
using TrackingServer.Util.JsonFormats;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TuioController : Controller
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        
        private readonly TuioService _service;
        private readonly ConfigurationManager _configManager;

        public TuioController(ConfigurationManager configManager, TuioService service)
        {
            _configManager = configManager;
            _service = service;
        }
        
        // GET: api/Tuio/IsBroadcasting
        [Route("IsBroadcasting")]
        [HttpGet]
        public ActionResult<JsonSimpleValue<bool>> IsBroadcasting() => new(
            new JsonSimpleValue<bool> {
                Name = "IsBroadcasting", Value = _service.IsTuioBroadcastingEnabled
            });
        
        // GET: api/Tuio/GetTuioConfiguration
        [Route("GetTuioConfiguration")]
        [HttpGet]
        public TuioConfiguration GetTuioConfiguration() => _service.Configuration;
        
        // GET: api/Tuio/GetTransportProtocols
        [Route("GetTransportProtocols")]
        [HttpGet]
        public IEnumerable<string> GetTransportProtocols() => Enum.GetNames(typeof(TransportProtocol));
        
        // GET: api/Tuio/GetTuioProtocolVersions
        [Route("GetTuioProtocolVersions")]
        [HttpGet]
        public IEnumerable<string> GetTuioProtocolVersions() => Enum.GetNames(typeof(ProtocolVersion));

        // GET: api/Tuio/GetTuioInterpretations
        [Route("GetTuioInterpretations")]
        [HttpGet]
        public IEnumerable<string> GetTuioInterpretations() => Enum.GetNames(typeof(TuioInterpretation));

        // POST: api/Tuio/SetPort/
        [HttpPost("SetPort")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<int>> SetPort([FromBody]JsonSimpleValue<int> port)
        {
            var isValid = JsonSimpleValue<int>.ValidateArguments(port, "Port",
                $"{nameof(TuioController)}.{nameof(SetPort)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);
            
            _service.Configuration.ServerPort = port.Value;

            return new ActionResult<JsonSimpleValue<int>>(port);
        }
        
        // POST: api/Tuio/SetAddress/
        [HttpPost("SetAddress")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SetAddress([FromBody]JsonSimpleValue<string> address)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(address, "Address",
                $"{nameof(TuioController)}.{nameof(SetAddress)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);

            _service.Configuration.ServerAddress = address.Value;
            return new ActionResult<JsonSimpleValue<string>>(address);
        }
        
        // POST: api/Tuio/SelectTransportProtocol
        [HttpPost("SelectTransportProtocol")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SelectTransportProtocol([FromBody]JsonSimpleValue<string> typeArgument)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(typeArgument, "TransportProtocol",
                $"{nameof(TuioController)}.{nameof(SelectTransportProtocol)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);
            
            var success = Enum.TryParse<TransportProtocol>(typeArgument.Value, out var type);
            
            if (!success)
            {
                var msg =
                    $"Failed to switch {nameof(TransportProtocol)} by {typeof(TuioController).FullName}. Parse Error - {typeArgument.Value} is not a valid value of {nameof(TransportProtocol)}.";
                Logger.Error(msg);
                return StatusCode(StatusCodes.Status500InternalServerError, msg);
            }
            
            _service.Configuration.Transport = type;

            var currentType = (uint) GetTuioConfiguration().Transport;
            
            if (currentType == (uint) type)
                Logger.Info($"Successfully Switched {nameof(TransportProtocol)} to {type} by {typeof(TuioController).FullName}.");
            else
                Logger.Error($"Failed to switch {nameof(TransportProtocol)} by {typeof(TuioController).FullName}. Parse Error - {type} is not a valid value of {nameof(TransportProtocol)}.");

            return new ActionResult<JsonSimpleValue<string>>(typeArgument);
        }
        
        // POST: api/Tuio/SelectTuioProtocol
        [HttpPost("SelectTuioProtocol")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SelectTuioProtocol([FromBody]JsonSimpleValue<string> typeArgument)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(typeArgument, "ProtocolVersion",
                $"{nameof(TuioController)}.{nameof(SelectTuioProtocol)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);
            
            var success = Enum.TryParse<ProtocolVersion>(typeArgument.Value, out var type);
            
            if (!success)
            {
                var msg =
                    $"Failed to switch {nameof(ProtocolVersion)} by {typeof(TuioController).FullName}. Parse Error - {typeArgument.Value} is not a valid value of {nameof(ProtocolVersion)}.";
                Logger.Error(msg);
                return StatusCode(StatusCodes.Status500InternalServerError, msg);
            }
            
            _service.Configuration.Protocol = type;

            var currentType = (uint) GetTuioConfiguration().Protocol;
            const string name = nameof(_service.Configuration.Protocol);
            
            if (currentType == (uint) type)
                Logger.Info($"Successfully Switched {nameof(ProtocolVersion)} to {type} by {typeof(TuioController).FullName}.");
            else
                Logger.Error($"Failed to switch {nameof(ProtocolVersion)} by {typeof(TuioController).FullName}. Parse Error - {type} is not a valid value of {nameof(ProtocolVersion)}.");

            return new ActionResult<JsonSimpleValue<string>>(typeArgument);
        }
        
        // POST: api/Tuio/SelectTuioInterpretation
        [HttpPost("SelectTuioInterpretation")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SelectTuioInterpretation([FromBody]JsonSimpleValue<string> typeArgument)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(typeArgument, "TuioInterpretation",
                $"{nameof(TuioController)}.{nameof(SelectTuioInterpretation)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);
            
            var success = Enum.TryParse<TuioInterpretation>(typeArgument.Value, out var type);
            
            if (!success)
            {
                var msg =
                    $"Failed to switch {nameof(TuioInterpretation)} by {typeof(TuioController).FullName}. Parse Error - {typeArgument.Value} is not a valid value of {nameof(TuioInterpretation)}.";
                Logger.Error(msg);
                return StatusCode(StatusCodes.Status500InternalServerError, msg);
            }
            
            _service.Configuration.Interpretation = type;

            var currentType = (uint) GetTuioConfiguration().Interpretation;
            const string name = nameof(_service.Configuration.Interpretation);
            
            if (currentType == (uint) type)
                Logger.Info($"Successfully Switched {nameof(TuioInterpretation)} to {type} by {typeof(TuioController).FullName}.");
            else
                Logger.Error($"Failed to switch {nameof(TuioInterpretation)} by {typeof(TuioController).FullName}. Parse Error - {type} is not a valid value of {nameof(TuioInterpretation)}.");

            return new ActionResult<JsonSimpleValue<string>>(typeArgument);
        }

        // PUT: api/Tuio/ToggleBroadcast
        [HttpPut("ToggleBroadcast")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonSimpleValue<bool>> ToggleBroadcast()
        {
            _service.IsTuioBroadcastingEnabled = !_service.IsTuioBroadcastingEnabled;

            Logger.Info($"Tuio {(_service.IsTuioBroadcastingEnabled ? "started" : "stopped")} by {typeof(NetworkController).FullName}.");

            return new ActionResult<JsonSimpleValue<bool>>(new JsonSimpleValue<bool>{ Name = "IsBroadcasting", Value = _service.IsTuioBroadcastingEnabled});
        }
        
        // PUT: api/Tuio/Save
        [HttpPut("Save")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonSimpleValue<bool>> SaveTuioSettings()
        {
            _configManager.Settings.TuioSettingValues = _service.Configuration;
            _configManager.Update(_configManager.Settings);
            
            Logger.Info($"Saved {typeof(TuioConfiguration).FullName} - Updated Values: {Environment.NewLine}{_configManager.Settings.TuioSettingValues.GetTuioConfigurationString()}");

            return new ActionResult<JsonSimpleValue<bool>>(new JsonSimpleValue<bool>{ Name = "SaveSuccessful", Value = true});
        }
    }
}