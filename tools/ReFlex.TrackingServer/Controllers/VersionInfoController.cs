using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using TrackingServer.Data.Version;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VersionInfoController : Controller
    {
        private VersionInfoStore _store;
        
        public VersionInfoController(VersionInfoStore store)
        {
            _store = store;
        }
        
        // GET: api/Log
        [HttpGet]
        public IEnumerable<AppVersionInfo> Get()
        {
            return _store.VersionInfo;
        }
    }
}