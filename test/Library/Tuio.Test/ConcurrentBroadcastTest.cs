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
        
        [TearDown]
        public void Dispose()
        {
            _broadcastInstance?.Dispose();
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

            Assert.That(_broadcastInstance.Configuration, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            
            _broadcastInstance.Broadcast(new List<Interaction>());
            
            await Task.Run(() => Thread.Sleep(1000));

            Assert.That(((BusyWaitingTuioSender)_sender).IsWaiting, Is.True);
            Assert.That(_broadcastInstance.IsSending, Is.True);
            
            ((BusyWaitingTuioSender)_sender).StopWaiting();

            await Task.Run(() => Thread.Sleep(1000));

            Assert.That(((BusyWaitingTuioSender)_sender).IsWaiting, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
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

            Assert.That(_broadcastInstance.Configuration, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            
            _broadcastInstance.Broadcast(new List<Interaction>());
            
            await Task.Run(() => Thread.Sleep(1000));

            Assert.That(((BusyWaitingTuioSender)_sender).IsWaiting, Is.True);
            Assert.That(_broadcastInstance.IsSending, Is.True);
            
            ((BusyWaitingTuioSender)_sender).StopWaiting();
            
            // second message should return without error
            await _broadcastInstance.Broadcast(new List<Interaction>());

            await Task.Run(() => Thread.Sleep(1000));

            Assert.That(((BusyWaitingTuioSender)_sender).IsWaiting, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
        }
    }
}