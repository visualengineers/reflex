using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CoreOSC;
using Moq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Test
{
    public class TuioBroadcastTest
    {
        private TuioBroadcast _broadcastInstance;
        private readonly List<Interaction> _interactions = new List<Interaction>();
        private TuioConfiguration _config;

        private Mock<ITuioMessageBuilder> _mockBuilder;
        private Mock<ITuioSender> _mockSender;
        
        [SetUp]
        public void Setup()
        {
            _mockBuilder  = new Mock<ITuioMessageBuilder>();
            _mockSender = new Mock<ITuioSender>();

            _mockSender.Setup(m => m.IsInitialized).Returns(true);

            _broadcastInstance = new TuioBroadcast(_mockBuilder.Object, _mockSender.Object);
            
            _interactions.Add(new Interaction(new Point3(1f,0.5f, -0.5f), InteractionType.Push, 5f) { TouchId = 1});
            _interactions.Add(new Interaction(new Point3(0f,1f, 0.25f), InteractionType.Pull, 3f) { TouchId = 2});
        }

        [TearDown]
        public void Dispose()
        {
            _broadcastInstance?.Dispose();
        }
        
        /// <summary>
        /// Tests, if public constructor correctly initializes <see cref="ITuioMessageBuilder"/> ans <see cref="ITuioSender"/>
        /// </summary>
        [Test]
        public async Task TestDefaultConstructor()
        {
            _broadcastInstance = new TuioBroadcast();

            Assert.That(_broadcastInstance, Is.Not.Null);

            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);
            
            _config = new TuioConfiguration
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

            await _broadcastInstance.Configure(_config);

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
        }

        /// <summary>
        /// Tests, if initial values for IsConfigured and IsSending are correct and Configuration is null
        /// </summary>
        [Test]
        public void TestNotConfigured()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);

            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);
        }
        
        [Test]
        public async Task TestConfigurationIsNull()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);

            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            await _broadcastInstance.Configure(It.IsAny<TuioConfiguration>());

            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);
        }

        [Test]
        public async Task TestInitialization()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            _config = new TuioConfiguration
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

            await _broadcastInstance.Configure(_config);
            
            _mockSender.Verify(m => m.Initialize(_config), Times.Exactly(1));
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(1));

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            _mockSender.Reset();
        }
        
        [Test]
        public async Task TestSendingWithMock11()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            _config = new TuioConfiguration
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

            await _broadcastInstance.Configure(_config);
            
            _mockSender.Verify(m => m.Initialize(_config), Times.Exactly(1));
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(1));

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            await _broadcastInstance.Broadcast(_interactions);
            
            _mockBuilder.Verify(b => b.CreateTuio11Messages(It.IsAny<TuioParameters>(), _config.Interpretation), Times.Once);
            _mockSender.Verify(m => m.SendUdp(It.IsAny<OscBundle>()), Times.Once);
            
            _mockSender.Verify(m => m.SendTcp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendWebSocket(It.IsAny<OscBundle>()), Times.Never);
            
            _mockBuilder.Verify(b => b.CreateTuio20Messages(It.IsAny<TuioParameters>(), It.IsAny<TuioInterpretation>()), Times.Never);

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            _mockBuilder.Reset();
            _mockSender.Reset();
        } 
        
        [Test]
        public async Task TestInvalidConfiguration()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            await _broadcastInstance.Broadcast(_interactions);
            
            _mockBuilder.Verify(b => b.CreateTuio20Messages(It.IsAny<TuioParameters>(), It.IsAny<TuioInterpretation>()), Times.Never);
            _mockBuilder.Verify(b => b.CreateTuio11Messages(It.IsAny<TuioParameters>(), It.IsAny<TuioInterpretation>()), Times.Never);
                        
            _mockSender.Verify(m => m.SendTcp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendUdp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendWebSocket(It.IsAny<OscBundle>()), Times.Never);
            
            _mockBuilder.Reset();
            _mockSender.Reset();
        } 
        
        [Test]
        public async Task TestInvalidTransport()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            Assert.That(Enum.IsDefined(typeof(TransportProtocol), Int32.MaxValue), Is.False);

            _config = new TuioConfiguration
            {
                Interpretation = TuioInterpretation.TouchPoint2DwithPressure,
                Protocol = ProtocolVersion.TUIO_VERSION_2_0,
                Transport = (TransportProtocol)Int32.MaxValue,
                SensorDescription = "TestSensor",
                SensorHeight = 300,
                SensorWidth = 400,
                ServerAddress = "128.0.0.1",
                ServerPort = 4321,
                SessionId = 225
            };

            await _broadcastInstance.Configure(_config);
            
            _mockSender.Verify(m => m.Initialize(_config), Times.Exactly(1));
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(1));

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);

            Assert.ThrowsAsync<ArgumentOutOfRangeException>(async () => await _broadcastInstance.Broadcast(_interactions));
            
            _mockBuilder.Verify(b => b.CreateTuio20Messages(It.IsAny<TuioParameters>(), _config.Interpretation), Times.Once);
            
            _mockSender.Verify(m => m.SendTcp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendUdp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendWebSocket(It.IsAny<OscBundle>()), Times.Never);

            _mockBuilder.Verify(b => b.CreateTuio11Messages(It.IsAny<TuioParameters>(), It.IsAny<TuioInterpretation>()), Times.Never);

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            _mockBuilder.Reset();
            _mockSender.Reset();
        } 
        
        [Test]
        public async Task TestSendingWithMock20()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            _config = new TuioConfiguration
            {
                Interpretation = TuioInterpretation.TouchPoint2DwithPressure,
                Protocol = ProtocolVersion.TUIO_VERSION_2_0,
                Transport = TransportProtocol.Tcp,
                SensorDescription = "TestSensor",
                SensorHeight = 300,
                SensorWidth = 400,
                ServerAddress = "128.0.0.1",
                ServerPort = 4321,
                SessionId = 225
            };

            await _broadcastInstance.Configure(_config);
            
            _mockSender.Verify(m => m.Initialize(_config), Times.Exactly(1));
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(1));

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            await _broadcastInstance.Broadcast(_interactions);
            
            _mockBuilder.Verify(b => b.CreateTuio20Messages(It.IsAny<TuioParameters>(), _config.Interpretation), Times.Once);
            _mockSender.Verify(m => m.SendTcp(It.IsAny<OscBundle>()), Times.Once);
            
            _mockSender.Verify(m => m.SendUdp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendWebSocket(It.IsAny<OscBundle>()), Times.Never);
            
            _mockBuilder.Verify(b => b.CreateTuio11Messages(It.IsAny<TuioParameters>(), It.IsAny<TuioInterpretation>()), Times.Never);

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            _mockBuilder.Reset();
            _mockSender.Reset();
        } 
        
        [Test]
        public async Task TestSendingWithMocWebSocket()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            _config = new TuioConfiguration
            {
                Interpretation = TuioInterpretation.TouchPoint2DwithPressure,
                Protocol = ProtocolVersion.TUIO_VERSION_2_0,
                Transport = TransportProtocol.WebSocket,
                SensorDescription = "WebSocketTest",
                SensorHeight = 50,
                SensorWidth = 400,
                ServerAddress = "Localhost",
                ServerPort = 3333,
                SessionId = 112
            };

            await _broadcastInstance.Configure(_config);
            
            _mockSender.Verify(m => m.Initialize(_config), Times.Exactly(1));
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(1));

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            await _broadcastInstance.Broadcast(_interactions);
            
            _mockBuilder.Verify(b => b.CreateTuio20Messages(It.IsAny<TuioParameters>(), _config.Interpretation), Times.Once);
            _mockSender.Verify(m => m.SendWebSocket(It.IsAny<OscBundle>()), Times.Once);
            
            _mockSender.Verify(m => m.SendUdp(It.IsAny<OscBundle>()), Times.Never);
            _mockSender.Verify(m => m.SendTcp(It.IsAny<OscBundle>()), Times.Never);
            
            _mockBuilder.Verify(b => b.CreateTuio11Messages(It.IsAny<TuioParameters>(), It.IsAny<TuioInterpretation>()), Times.Never);

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);
            
            _mockBuilder.Reset();
            _mockSender.Reset();
        }

        [Test]
        public async Task TestDispose()
        {
            Assert.That(_broadcastInstance, Is.Not.Null);
            Assert.That(_broadcastInstance.IsConfigured, Is.False);
            Assert.That(_broadcastInstance.IsSending, Is.False);
            Assert.That(_broadcastInstance.Configuration, Is.Null);

            _config = new TuioConfiguration
            {
                Interpretation = TuioInterpretation.TouchPoint2DwithPressure,
                Protocol = ProtocolVersion.TUIO_VERSION_2_0,
                Transport = TransportProtocol.WebSocket,
                SensorDescription = "WebSocketTest",
                SensorHeight = 50,
                SensorWidth = 400,
                ServerAddress = "Localhost",
                ServerPort = 3333,
                SessionId = 112
            };

            await _broadcastInstance.Configure(_config);
            
            _mockSender.Verify(m => m.Initialize(_config), Times.Exactly(1));
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(1));

            Assert.That(_broadcastInstance.IsConfigured, Is.True);
            Assert.That(_broadcastInstance.Configuration, Is.EqualTo(_config));
            Assert.That(_broadcastInstance.IsSending, Is.False);

            _broadcastInstance.Dispose();
            
            _mockSender.Verify(m => m.StopAllConnections(), Times.Exactly(2));
            
            _mockBuilder.Reset();
            _mockSender.Reset();
        }
    }
}