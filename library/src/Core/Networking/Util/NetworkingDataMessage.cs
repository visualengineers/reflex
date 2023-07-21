using System;

namespace ReFlex.Core.Networking.Util
{
    public class NetworkingDataMessage : EventArgs
    {
        public string Message { get; private set; }

        public Guid ClientId { get; private set; }
        
        public NetworkingDataMessage(string message, Guid clientId)
        {
            Message = message;
            ClientId = clientId;
        } 
    }
}
