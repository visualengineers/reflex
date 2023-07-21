using System.Collections.Generic;
using ReFlex.Core.Networking.Util;

namespace TrackingServer.Util
{
    public class NetworkAttributes
    {
        public bool IsActive { get; set; }
        
        public IEnumerable<string> Interfaces { get; set; }
        
        public uint SelectedInterface { get; set; }
        
        public string Address { get; set; }
        
        public int Port { get; set; }
        
        public string Endpoint { get; set; }
    }
}