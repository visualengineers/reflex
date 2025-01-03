using System.Net.Mime;
using Microsoft.AspNetCore.Mvc;
using NLog;
using ReFlex.Core.Networking.Util;
using TrackingServer.Data.Config;
using TrackingServer.Model;
using TrackingServer.Util;
using TrackingServer.Util.JsonFormats;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NetworkController : Controller
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        
        private readonly NetworkingService _service;
        private readonly ConfigurationManager _configManager;

        public NetworkController(NetworkingService service, ConfigurationManager configMgr)
        {
            _service = service;
            _configManager = configMgr;
        }
        
        // GET: api/Network/Status
        [Route("Status")]
        [HttpGet]
        public NetworkAttributes Status()
        {
            return new NetworkAttributes
            {
                IsActive = IsLoopRunning(),
                Address = GetAddress(),
                Endpoint = GetEndpoint(),
                Port = GetPort(),
                Interfaces = GetNetworkTypes(),
                SelectedInterface = GetNetworkType()
            };
        }
        
        // GET: api/Network/IsActive
        [Route("IsActive")]
        [HttpGet]
        public bool IsLoopRunning() => _service.IsServerBroadcasting;

        // GET: api/Network/GetAddress
        [Route("GetAddress")]
        [HttpGet]
        public string GetAddress() => _service.Address;
        
        // GET: api/Network/GetPort
        [Route("GetPort")]
        [HttpGet]
        public int GetPort() => _service.Port;
        
        // GET: api/Network/GetEndpoint
        [Route("GetEndpoint")]
        [HttpGet]
        public string GetEndpoint() => _service.Endpoint;

        // GET: api/Network/GetNetworkType
        [Route("GetNetworkType")]
        [HttpGet]
        public uint GetNetworkType() => (uint) _service.Type;

        // GET: api/Network/GetNetworkTypes
        [Route("GetNetworkTypes")]
        [HttpGet]
        public IEnumerable<string> GetNetworkTypes() => Enum.GetNames(typeof(NetworkInterface));

        // POST: api/Network/SetPort/
        [HttpPost("SetPort")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<int>> SetPort([FromBody]JsonSimpleValue<int> port)
        {
            var isValid = JsonSimpleValue<int>.ValidateArguments(port, "Port",
                $"{nameof(NetworkController)}.{nameof(SetPort)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);
            
            _service.Port = port.Value;

            return new ActionResult<JsonSimpleValue<int>>(port);
        }
        
        // POST: api/Network/SetAddress/
        [HttpPost("SetAddress")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SetAddress([FromBody]JsonSimpleValue<string> address)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(address, "Address",
                $"{nameof(NetworkController)}.{nameof(SetAddress)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);

            _service.Address = address.Value;
            return new ActionResult<JsonSimpleValue<string>>(address);
        }
        
        // POST: api/Network/SetEndpoint/
        [HttpPost("SetEndpoint")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SetEndpoint([FromBody]JsonSimpleValue<string> endpoint)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(endpoint, "Endpoint",
                $"{nameof(NetworkController)}.{nameof(SetEndpoint)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);

            _service.Endpoint = endpoint.Value;
            return new ActionResult<JsonSimpleValue<string>>(endpoint);
        }

        // POST: api/Network/SelectNetworkType
        [HttpPost("SelectNetworkType")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<JsonSimpleValue<string>> SelectNetworkType([FromBody]JsonSimpleValue<string> typeArgument)
        {
            var isValid = JsonSimpleValue<string>.ValidateArguments(typeArgument, "NetworkType",
                $"{nameof(NetworkController)}.{nameof(SelectNetworkType)}", out var errorMsg);

            if (!isValid)
                return BadRequest(errorMsg);
            
            var success = Enum.TryParse<NetworkInterface>(typeArgument.Value, out var type);
            
            if (!success)
            {
                var msg =
                    $"Failed to switch {nameof(NetworkInterface)} by {typeof(NetworkController).FullName}. Parse Error - {typeArgument.Value} is not a valid value of {nameof(NetworkInterface)}.";
                Logger.Error(msg);
                return StatusCode(StatusCodes.Status500InternalServerError, msg);
            }
            
            _service.Type = type;

            var currentType = GetNetworkType();
            
            if (currentType == (uint) type)
                Logger.Info($"Successfully Switched {nameof(NetworkInterface)} to {type} by {typeof(NetworkController).FullName}.");
            else
                Logger.Error($"Failed to switch {nameof(NetworkInterface)} by {typeof(NetworkController).FullName}. Parse Error - {type} is not a valid value of {nameof(NetworkInterface)}.");

            return new ActionResult<JsonSimpleValue<string>>(typeArgument);
        }
        
        // POST: api/Network/SelectNetworkType
        [HttpPost("StartBroadcast")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<NetworkSettings> StartBroadcast([FromBody]NetworkSettings settings)
        {
            // if settings re provided: stop running server and update settings
            if (settings != null)
            {
                if (_service.IsServerBroadcasting)
                    _service.IsServerBroadcasting = false;
                
                _service.Endpoint = settings.Endpoint;
                _service.Port = settings.Port;
                _service.Type = settings.NetworkInterfaceType;
                SaveNetworkingSettings();
            }

            // if service has been stopped: start networking with new configuration
            if (!_service.IsServerBroadcasting)
            {
                ToggleNetworking();
            }

            var currentSettings = _configManager.Settings.NetworkSettingValues;
            Logger.Info($"Networking started with Settings: {currentSettings.GetNetworksSettingsString()}. No changes made in {typeof(NetworkController).FullName}.{nameof(StartBroadcast)}.");
            return new ActionResult<NetworkSettings>(currentSettings);
        }

        // PUT: api/Network/ToggleNetworking
        [HttpPut("ToggleNetworking")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonSimpleValue<bool>> ToggleNetworking()
        {
            _service.IsServerBroadcasting = !_service.IsServerBroadcasting;

            Logger.Info($"Network {(_service.IsServerBroadcasting ? "started" : "stopped")} by {typeof(NetworkController).FullName}.");

            return new ActionResult<JsonSimpleValue<bool>>(new JsonSimpleValue<bool>{ Name = "IsBroadcasting", Value = _service.IsServerBroadcasting});
        }
        
        // PUT: api/Network/Save
        [HttpPut("Save")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonSimpleValue<bool>> SaveNetworkingSettings()
        {
            _configManager.Settings.NetworkSettingValues.Address = _service.Address;
            _configManager.Settings.NetworkSettingValues.Endpoint = _service.Endpoint;
            _configManager.Settings.NetworkSettingValues.Port = _service.Port;
            _configManager.Settings.NetworkSettingValues.NetworkInterfaceType = _service.Type;
            
            _configManager.Update(_configManager.Settings);
            
            Logger.Info($"Saved {typeof(NetworkSettings).FullName} - Updated Values: {Environment.NewLine}{_configManager.Settings.NetworkSettingValues}");

            return new ActionResult<JsonSimpleValue<bool>>(new JsonSimpleValue<bool>{ Name = "SaveSuccessful", Value = true});
        }
    }
}