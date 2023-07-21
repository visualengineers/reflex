using System.Collections.Generic;
using System.Net.Sockets;
using System.Threading.Tasks;
using CoreOSC;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Tuio.Components;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Test.Mocks
{
    public class TestTuioSender : TuioSender
    {
        internal readonly List<OscMessage> SentMessages = new();

        private UdpClient _udp;
        private ITcpClient _tcp;
        private IClientWebSocket _clientWebSocket;

        internal TestTuioSender(UdpClient udp, ITcpClient tcp, IClientWebSocket ws)
        {
            _udp = udp;
            _tcp = tcp;
            _clientWebSocket = ws;
            UdpClient = udp;
            TcpClient = tcp;
            WsClient = ws;
        }

        public override void Initialize(TuioConfiguration config)
        {
            base.Initialize(config);
            UdpClient = _udp;
            TcpClient = _tcp;
            WsClient = _clientWebSocket;
            IsInitialized = true;
            SentMessages.Clear();
        }

        protected override Task SendOscMessageUdp(OscMessage msg)
        {
            SentMessages.Add(msg);
            return Task.CompletedTask;
        }
        
        protected override Task SendOscMessageTcp(OscMessage msg)
        {
            SentMessages.Add(msg);
            return Task.CompletedTask;
        }
        
        protected override Task SendOscMessageWebSocket(OscMessage msg)
        {
            SentMessages.Add(msg);
            return Task.CompletedTask;
        }
    }
}