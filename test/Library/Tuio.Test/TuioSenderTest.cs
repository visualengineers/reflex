using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using CoreOSC;
using Moq;
using NUnit.Framework;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Tuio.Components;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Test.Mocks;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Test
{
    [TestFixture]
    public class TuioSenderTest
    {
        private ITuioSender _instance;
        private OscBundle _bundle;
        
        /// <summary>
        /// Initialize default <see cref="TuioSender"/> instance and create random number of <see cref="OscMessage"/> for testing.
        /// </summary>
        [SetUp]
        public void Setup()
        {
            _instance = new TuioSender();
            var rnd = new Random();
            var num = rnd.Next(10);

            var msgList = new List<OscMessage>();

            for (var i = 0; i < num; i++)
            {
                msgList.Add(new OscMessage(new Address($"{i}")));
            }
            
            _bundle = new OscBundle(new Timetag(), msgList);
        }

        /// <summary>
        /// provide a null value for configuration should not throw an exception and also not change initialization state
        /// </summary>
        [Test]
        public void TestInitializeWithNull()
        {
            Assert.IsFalse(_instance.IsInitialized);

            _instance.Initialize(It.IsAny<TuioConfiguration>());

            Assert.IsFalse(_instance.IsInitialized);

            var valid = new TuioConfiguration
            {
                Transport = TransportProtocol.Udp,
                ServerAddress = "Localhost",
                ServerPort = 123
            };
            
            _instance.Initialize(valid);

            Assert.IsTrue(_instance.IsInitialized);
            
            _instance.Initialize(It.IsAny<TuioConfiguration>());
            
            // invalid config should not change configuration
            Assert.IsTrue(_instance.IsInitialized);
        }
        
        /// <summary>
        /// check that config is checked for:
        /// - config == null
        /// - config.ServerAddress is not an empty string
        /// - config.ServerPort > 0
        /// </summary>
        [Test]
        public void TestInitializationValidity()
        {
            Assert.IsFalse(_instance.IsInitialized);
            
            var invalid = new TuioConfiguration
            {
                Transport = TransportProtocol.Udp,
                ServerAddress = null
            };

            _instance.Initialize(invalid);

            Assert.IsFalse(_instance.IsInitialized);

            invalid.ServerPort = 123;
            invalid.ServerAddress = "    ";
            
            _instance.Initialize(invalid);

            Assert.IsFalse(_instance.IsInitialized);
            
            invalid.ServerPort = -1;
            invalid.ServerAddress = "127.0.0.1";
            
            _instance.Initialize(invalid);

            Assert.IsFalse(_instance.IsInitialized);

            // default parameters should work
            var valid = new TuioConfiguration();
            
            _instance.Initialize(valid);

            Assert.IsTrue(_instance.IsInitialized);
        }
        
        /// <summary>
        /// provide an invalid value for transport should throw an exception and also not change initialization state
        /// </summary>
        [Test]
        public void TestInitializeWithInvalidTransport()
        {
            Assert.IsFalse(_instance.IsInitialized);
            
            Assert.IsFalse(Enum.IsDefined(typeof(TransportProtocol), Int32.MaxValue));

            var invalid = new TuioConfiguration { Transport = (TransportProtocol)Int32.MaxValue };
            
            Assert.Throws<ArgumentException>(() =>_instance.Initialize(invalid));

            Assert.IsFalse(_instance.IsInitialized);

            var valid = new TuioConfiguration
            {
                Transport = TransportProtocol.Udp,
                ServerAddress = "Localhost",
                ServerPort = 123
            };
            
            _instance.Initialize(valid);

            Assert.IsTrue(_instance.IsInitialized);
            
            Assert.Throws<ArgumentException>(() =>_instance.Initialize(invalid));
            
            // invalid config should not change configuration
            Assert.IsTrue(_instance.IsInitialized);
        }
        
        /// <summary>
        /// Test if all messages in the bundle are sent via udp in the correct order.
        /// </summary>
        [Test]
        public async Task TestUdp()
        {
            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>().Object;
            var wsMock = new Mock<IClientWebSocket>().Object;

            var mockInstance = new TestTuioSender(udpMock, tcpMock, wsMock);
            
            Assert.IsFalse(mockInstance.IsInitialized);
            
            mockInstance.Initialize(new TuioConfiguration());
            
            Assert.IsTrue(mockInstance.IsInitialized);

            await mockInstance.SendUdp(_bundle);

            var msgList = _bundle.Messages.ToList();
            Assert.AreEqual(msgList.Count, mockInstance.SentMessages.Count);

            for (var index = 0; index < msgList.Count; index++)
            {
                var msg = msgList[index];
                Assert.AreEqual(msg, mockInstance.SentMessages[index]);
            }
            
            // check, if exceptions are caught
            var bndl = new OscBundle(new Timetag(), null);
            Assert.DoesNotThrowAsync(async () => await mockInstance.SendUdp(bndl));
        }

        /// <summary>
        /// Test if connection attempt is made when not connected
        /// </summary>
        [Test]
        public async Task TestTcpNotConnected()
        {
            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>();

            tcpMock.SetupGet(m => m.Connected).Returns(false);

            var wsMock = new Mock<IClientWebSocket>().Object;

            var mockInstance = new TestTuioSender(udpMock, tcpMock.Object, wsMock);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.Tcp });

            Assert.IsTrue(mockInstance.IsInitialized);

            await mockInstance.SendTcp(_bundle);

            tcpMock.Verify(m => m.ConnectAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Once);
            Assert.AreEqual(0, mockInstance.SentMessages.Count);
        }

        /// <summary>
        /// Test if connection no additional attempt is made when connected successfully
        /// </summary>
        [Test]
        public async Task TestTcpConnected()
        {
            var msgList = _bundle.Messages.ToList();

            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>();

            tcpMock.SetupGet(m => m.Connected).Returns(true);

            var wsMock = new Mock<IClientWebSocket>().Object;

            var mockInstance = new TestTuioSender(udpMock, tcpMock.Object, wsMock);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.Tcp });

            Assert.IsTrue(mockInstance.IsInitialized);

            await mockInstance.SendTcp(_bundle);

            tcpMock.Verify(m => m.ConnectAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
            Assert.AreEqual(msgList.Count(), mockInstance.SentMessages.Count);
            
            for (var index = 0; index < msgList.Count; index++)
            {
                var msg = msgList[index];
                Assert.AreEqual(msg, mockInstance.SentMessages[index]);
            }
        }
        
        /// <summary>
        /// Test if sending is continued even when sending throws an error.
        /// </summary>
        [Test]
        public Task TestTcpError()
        {
            var msgList = _bundle.Messages.ToList();

            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>();

            tcpMock.SetupGet(m => m.Connected).Returns(true);
            tcpMock.Setup(m => m.GetStream()).Throws<SocketException>();

            var wsMock = new Mock<IClientWebSocket>().Object;

            var mockInstance = new TestTuioSender(udpMock, tcpMock.Object, wsMock);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.Tcp });

            Assert.IsTrue(mockInstance.IsInitialized);

            Assert.DoesNotThrowAsync(async () => await mockInstance.SendTcp(_bundle));

            tcpMock.Verify(m => m.ConnectAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
            Assert.AreEqual(msgList.Count, mockInstance.SentMessages.Count);
            
            return Task.CompletedTask;
        }
        
        /// <summary>
        /// Test if error is caught when connection attempt throws an error.
        /// </summary>
        [Test]
        public Task TestTcpConnectionError()
        {
            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>();

            tcpMock.SetupGet(m => m.Connected).Returns(false);
            tcpMock.Setup(m => m.ConnectAsync(It.IsAny<string>(), It.IsAny<int>())).Throws<ArgumentException>();

            var wsMock = new Mock<IClientWebSocket>().Object;

            var mockInstance = new TestTuioSender(udpMock, tcpMock.Object, wsMock);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.Tcp });

            Assert.IsTrue(mockInstance.IsInitialized);

            Assert.DoesNotThrowAsync(async () => await mockInstance.SendTcp(_bundle));

            tcpMock.Verify(m => m.ConnectAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Once);
            Assert.AreEqual(0, mockInstance.SentMessages.Count);
            
            return Task.CompletedTask;
        }
        
        /// <summary>
        /// Test if connection attempt is made when not connected.
        /// </summary>
        [Test]
        public async Task TestWebSocketNotConnected()
        {
            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>().Object;

            var wsMock = new Mock<IClientWebSocket>();
            wsMock.SetupGet(m => m.State).Returns(WebSocketState.Closed);

            var mockInstance = new TestTuioSender(udpMock, tcpMock, wsMock.Object);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.WebSocket });

            Assert.IsTrue(mockInstance.IsInitialized);

            await mockInstance.SendWebSocket(_bundle);

            wsMock.Verify(m => m.ConnectAsync(It.IsAny<Uri>(), It.IsAny<CancellationToken>()), Times.Once);
            Assert.AreEqual(0, mockInstance.SentMessages.Count);
        }

        /// <summary>
        /// Test if connection no further attempt is made when connected successfully
        /// </summary>
        [Test]
        public async Task TestWebSocketConnected()
        {
            var msgList = _bundle.Messages.ToList();

            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>().Object;

            var wsMock = new Mock<IClientWebSocket>();
            wsMock.SetupGet(m => m.State).Returns(WebSocketState.Open);

            var mockInstance = new TestTuioSender(udpMock, tcpMock, wsMock.Object);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.WebSocket });

            Assert.IsTrue(mockInstance.IsInitialized);

            await mockInstance.SendWebSocket(_bundle);

            wsMock.Verify(m => m.ConnectAsync(It.IsAny<Uri>(), It.IsAny<CancellationToken>()), Times.Never);
            Assert.AreEqual(msgList.Count(), mockInstance.SentMessages.Count);
            
            for (var index = 0; index < msgList.Count; index++)
            {
                var msg = msgList[index];
                Assert.AreEqual(msg, mockInstance.SentMessages[index]);
            }
        }
        
        /// <summary>
        /// Test if sending is continued even when sending throws an error.
        /// </summary>
        [Test]
        public Task TestWebSocketError()
        {
            var msgList = _bundle.Messages.ToList();

            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>().Object;

            var wsMock = new Mock<IClientWebSocket>();
            wsMock.SetupGet(m => m.State).Returns(WebSocketState.Open);
            wsMock.Setup(m => m.SendAsync(It.IsAny<ArraySegment<byte>>(), It.IsAny<WebSocketMessageType>(),
                It.IsAny<bool>(), It.IsAny<CancellationToken>())).Throws<SocketException>();
            
            var mockInstance = new TestTuioSender(udpMock, tcpMock, wsMock.Object);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.WebSocket });

            Assert.IsTrue(mockInstance.IsInitialized);

            Assert.DoesNotThrowAsync(async () => await mockInstance.SendWebSocket(_bundle));

            wsMock.Verify(m => m.ConnectAsync(It.IsAny<Uri>(), It.IsAny<CancellationToken>()), Times.Never);
            Assert.AreEqual(msgList.Count(), mockInstance.SentMessages.Count);
            
            for (var index = 0; index < msgList.Count; index++)
            {
                var msg = msgList[index];
                Assert.AreEqual(msg, mockInstance.SentMessages[index]);
            }

            return Task.CompletedTask;
        }
        
        /// <summary>
        /// Test if Exception is caught if connection attempt throws an error.
        /// </summary>
        [Test]
        public Task TestWebSocketConnectionError()
        {
            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>().Object;

            var wsMock = new Mock<IClientWebSocket>();
            wsMock.SetupGet(m => m.State).Returns(WebSocketState.Closed);
            wsMock.Setup(m => m.ConnectAsync(It.IsAny<Uri>(), It.IsAny<CancellationToken>())).Throws<ArgumentException>();
            
            var mockInstance = new TestTuioSender(udpMock, tcpMock, wsMock.Object);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.WebSocket });

            Assert.IsTrue(mockInstance.IsInitialized);

            Assert.DoesNotThrowAsync(async () => await mockInstance.SendWebSocket(_bundle));

            wsMock.Verify(m => m.ConnectAsync(It.IsAny<Uri>(), It.IsAny<CancellationToken>()), Times.Once);
            Assert.AreEqual(0, mockInstance.SentMessages.Count);
            
            return Task.CompletedTask;
        }

        /// <summary>
        /// Test if clients are closed
        /// </summary>
        [Test]
        public async Task TestClose()
        {
            var udpMock = Mock.Of<UdpClient>();
            var tcpMock = new Mock<ITcpClient>();
            var wsMock = new Mock<IClientWebSocket>();
            
            var mockInstance = new TestTuioSender(udpMock, tcpMock.Object, wsMock.Object);

            Assert.IsFalse(mockInstance.IsInitialized);

            mockInstance.Initialize(new TuioConfiguration() { Transport = TransportProtocol.WebSocket });

            Assert.IsTrue(mockInstance.IsInitialized);
            
            tcpMock.Verify(m => m.Close(), Times.Never);
            tcpMock.Verify(m => m.Dispose(), Times.Never);
            wsMock.Verify(m => m.CloseAsync(It.IsAny<WebSocketCloseStatus>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
            wsMock.Verify(m => m.Dispose(), Times.Never);

            await mockInstance.StopAllConnections();
            
            tcpMock.Verify(m => m.Close(), Times.Once);
            tcpMock.Verify(m => m.Dispose(), Times.Once);
            wsMock.Verify(m => m.CloseAsync(WebSocketCloseStatus.NormalClosure, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
            wsMock.Verify(m => m.Dispose(), Times.Once);
            
            Assert.IsFalse(mockInstance.IsInitialized);
        }
    }
}