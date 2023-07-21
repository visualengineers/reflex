using Microsoft.AspNetCore.Mvc;
using NLog;
using TrackingServer.Data.Log;
using TrackingServer.Model;
using TrackingServer.Util.JsonFormats;
using LogLevel = NLog.LogLevel;

namespace TrackingServer.Controllers
{
    

    [Route("api/[controller]")]
    [ApiController]
    public class LogController : ControllerBase
    {

        private readonly LogDataProviderService _logService;
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        
        public LogController(LogDataProviderService logService)
        {
            _logService = logService;
        }

        // GET: api/Log
        [HttpGet]
        public IEnumerable<LogMessageDetail> Get()
        {
            return _logService.GetMessages();
        }

        // GET: api/Log/Messages/5
        [Route("Messages/{startIndex}")]
        public IEnumerable<LogMessageDetail> GetMessagesFrom(int startIndex)
        {
            return _logService.GetMessages(startIndex);
        }
        
        // POST: api/Log/Add
        [HttpPost]
        [Route("Add")]
        public void AddErrorLog([FromBody]JsonSimpleValue<string> message)
        {
            Logger.Log(LogLevel.Error, message.Value);
        }
    }
}
