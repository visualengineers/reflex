using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Test.Mocks;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Test
{
    public class ConcurrentBroadcastTest
    {
        private TuioBroadcast _broadcastInstance;

        private Mock<ITuioMessageBuilder> _mockBuilder;
        private ITuioSender _sender;
        
        [SetUp]
        public void Setup()
        {
            _mockBuilder  = new Mock<ITuioMessageBuilder>();
            _sender = new BusyWaitingTuioSender();

            _broadcastInstance = new TuioBroadcast(_mockBuilder.Object, _sender);
        }

        [Test]
        public async Task CheckIsSending()
        {
            var config = new TuioConfiguration
            {
                Interpretation = TuioInterpretation.Point3D,
                Protocol = ProtocolVersion.TUIO_VERSION_1_1,
                Transport = TransportProtocol.Udp,
                SensorDescription = "TestSensor",
                SensorHeight = 100,
                SensorWidth = 200,
                ServerAddress = "127.0.0.1",
                ServerPort = 1234,
                SessionId = 147
            };
            
            await _broadcastInstance.Configure(config);
            
            Assert.IsNotNull(_broadcastInstance.Configuration);
            Assert.IsTrue(_broadcastInstance.IsConfigured);
            
            _broadcastInstance.Broadcast(new List<Interaction>());
            
            await Task.Run(() => Thread.Sleep(1000));
            
            Assert.IsTrue(((BusyWaitingTuioSender)_sender).IsWaiting);
            Assert.IsTrue(_broadcastInstance.IsSending);
            
            ((BusyWaitingTuioSender)_sender).StopWaiting();

            await Task.Run(() => Thread.Sleep(1000));
            
            Assert.IsFalse(((BusyWaitingTuioSender)_sender).IsWaiting);
            Assert.IsFalse(_broadcastInstance.IsSending);
        }
        
        [Test]
        public async Task CheckConcurrentSendNorError()
        {
            var config = new TuioConfiguration
            {
                Interpretation = TuioInterpretation.Point3D,
                Protocol = ProtocolVersion.TUIO_VERSION_1_1,
                Transport = TransportProtocol.Udp,
                SensorDescription = "TestSensor",
                SensorHeight = 100,
                SensorWidth = 200,
                ServerAddress = "127.0.0.1",
                ServerPort = 1234,
                SessionId = 147
            };
            
            await _broadcastInstance.Configure(config);
            
            Assert.IsNotNull(_broadcastInstance.Configuration);
            Assert.IsTrue(_broadcastInstance.IsConfigured);
            
            _broadcastInstance.Broadcast(new List<Interaction>());
            
            await Task.Run(() => Thread.Sleep(1000));
            
            Assert.IsTrue(((BusyWaitingTuioSender)_sender).IsWaiting);
            Assert.IsTrue(_broadcastInstance.IsSending);
            
            ((BusyWaitingTuioSender)_sender).StopWaiting();
            
            // second message should return without error
            await _broadcastInstance.Broadcast(new List<Interaction>());

            await Task.Run(() => Thread.Sleep(1000));
            
            Assert.IsFalse(((BusyWaitingTuioSender)_sender).IsWaiting);
            Assert.IsFalse(_broadcastInstance.IsSending);
        }
    }
}