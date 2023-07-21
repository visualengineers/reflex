using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tuio.Components;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Test
{
    [TestFixture]
    public class TuioMessageBuilderTest
    {
        private ITuioMessageBuilder _builder;
        private readonly List<Interaction> _interactions = new List<Interaction>();
        private TuioConfiguration _config;
        private Point3 _pos;
        private int _touchId;
        private int _frameId;

        [SetUp]
        public void Setup()
        {
            _builder = new TuioMessageBuilder();
            _interactions.Clear();

            var rnd = new Random();

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
                SessionId = rnd.Next()
            };

            _pos = new Point3((float)rnd.NextDouble(), (float)rnd.NextDouble(), -(float)rnd.NextDouble());
            _touchId = rnd.Next();
            
            _frameId = rnd.Next(10);
        }

        [Test]
        public void TestSingleInteraction20()
        {
            _interactions.Add(new Interaction(new Point3(1f, 0.5f, -0.5f), InteractionType.Push, 5f) { TouchId = 1 });

            var p = new TuioParameters("Localhost", _config, _interactions, 0);

            var result = _builder.CreateTuio20Messages(p, TuioInterpretation.Point3D);

            Assert.IsNotNull(result);

            Assert.AreEqual(3, result.ToList().Count);
        }

        [Test]
        public void TestSingleInteraction11()
        {
            _interactions.Add(new Interaction(new Point3(1f, 0.5f, -0.5f), InteractionType.Push, 5f) { TouchId = 1 });

            var p = new TuioParameters("Localhost", _config, _interactions, 1);

            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.Point3D);

            Assert.IsNotNull(result);

            Assert.AreEqual(4, result.ToList().Count);
        }

        [Test]
        public void TestMultipleInteractions20()
        {
            var rnd = new Random();
            var num = rnd.Next(0, 10);

            for (var i = 0; i < num; i++)
            {
                _interactions.Add(
                    new Interaction(new Point3(1f, 0.5f, -0.5f), InteractionType.Push, 5f) { TouchId = 1 });
            }

            var p = new TuioParameters("Localhost", _config, _interactions, 0);

            var result = _builder.CreateTuio20Messages(p, TuioInterpretation.TouchPoint2DwithPressure);

            Assert.IsNotNull(result);

            var msgList = result.ToList();

            Assert.AreEqual(2 + num, msgList.Count);

            for (var i = 0; i < num + 2; i++)
            {
                var start = msgList[i];
                if (i == 0)
                    Assert.AreEqual("/tuio2/frm", start.Address.Value);
                else if (i == num + 1)
                    Assert.AreEqual("/tuio2/alv", start.Address.Value);
                else
                    Assert.AreEqual("/tuio2/ptr", start.Address.Value);
            }
        }

        [Test]
        public void TestMultipleInteractions11()
        {
            var rnd = new Random();
            var num = rnd.Next(0, 10);

            for (var i = 0; i < num; i++)
            {
                _interactions.Add(
                    new Interaction(new Point3(1f, 0.5f, -0.5f), InteractionType.Push, 5f) { TouchId = 1 });
            }

            var p = new TuioParameters("Localhost", _config, _interactions, 2);

            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.TouchPoint2DwithPressure);

            Assert.IsNotNull(result);
            
            var msgList = result.ToList();

            Assert.AreEqual(3 + num, msgList.Count);
            
            for (var i = 0; i < num + 3; i++)
            {
                var start = msgList[i];
                var args = start.Arguments.ToList();
                Assert.AreEqual("/tuio/25Dobj", start.Address.Value);
                if (i == 0)
                    Assert.AreEqual("source", args[0]);
                else if (i == 1)
                    Assert.AreEqual("alive", args[0]);
                else if (i == num + 2)
                    Assert.AreEqual("fseq", args[0]);
                else
                    Assert.AreEqual("set", args[0]);
            }
        }

        [Test]
        public void VerifyCorrectValues11_25D()
        {
            _interactions.Add(
                new Interaction(
                        _pos,
                        InteractionType.Push, 5f)
                    { TouchId = _touchId });

            _config.Interpretation = TuioInterpretation.TouchPoint2DwithPressure;
            
            var p = new TuioParameters("Localhost11-25D", _config, _interactions, _frameId);

            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.TouchPoint2DwithPressure);

            Assert.IsNotNull(result);

            var msgList = result.ToList();
            Assert.AreEqual(4, msgList.Count);

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.AreEqual("/tuio/25Dobj", start.Address.Value);
            
            Assert.AreEqual(2, startArgs.Count);
            Assert.AreEqual("source", startArgs[0]);
            Assert.AreEqual(p.Source, startArgs[1]);

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.AreEqual("/tuio/25Dobj", alive.Address.Value);
            
            Assert.AreEqual(2, aliveArgs.Count);
            Assert.AreEqual("alive", aliveArgs[0]);
            Assert.AreEqual(p.SessionId, aliveArgs[1]);
            
            var posMsg = msgList[2];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.AreEqual("/tuio/25Dobj", posMsg.Address.Value);
            
            Assert.AreEqual(13, posMsgList.Count);
            Assert.AreEqual("set", posMsgList[0]);
            Assert.AreEqual(p.SessionId, posMsgList[1]);
            Assert.AreEqual(_touchId, posMsgList[2]);
            Assert.AreEqual(_pos.X, posMsgList[3]);
            Assert.AreEqual(_pos.Y, posMsgList[4]);
            Assert.AreEqual(_pos.Z, posMsgList[5]);
            Assert.AreEqual(0, posMsgList[6]);
            Assert.AreEqual(0, posMsgList[7]);
            Assert.AreEqual(0, posMsgList[8]);
            Assert.AreEqual(0, posMsgList[9]);
            Assert.AreEqual(0, posMsgList[10]);
            Assert.AreEqual(0, posMsgList[11]);
            Assert.AreEqual(0, posMsgList[12]);
            
            var end = msgList[3];
            var endArgs = end.Arguments.ToList();
            Assert.AreEqual("/tuio/25Dobj", end.Address.Value);
            
            Assert.AreEqual(2, endArgs.Count);
            Assert.AreEqual("fseq", endArgs[0]);
            Assert.AreEqual(p.FrameId, endArgs[1]);
        }
        
        [Test]
        public void VerifyCorrectValues11_3D()
        {
             _interactions.Add(
                new Interaction(
                        _pos,
                        InteractionType.Push, 5f)
                    { TouchId = _touchId });
             
             _config.Interpretation = TuioInterpretation.Point3D;

             var p = new TuioParameters("Localhost_11-3D", _config, _interactions, _frameId);
         
            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.Point3D);

            Assert.IsNotNull(result);

            var msgList = result.ToList();
            Assert.AreEqual(4, msgList.Count);

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", start.Address.Value);
            
            Assert.AreEqual(2, startArgs.Count);
            Assert.AreEqual("source", startArgs[0]);
            Assert.AreEqual(p.Source, startArgs[1]);

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", alive.Address.Value);
            
            Assert.AreEqual(2, aliveArgs.Count);
            Assert.AreEqual("alive", aliveArgs[0]);
            Assert.AreEqual(p.SessionId, aliveArgs[1]);
            
            var posMsg = msgList[2];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", posMsg.Address.Value);
            
            Assert.AreEqual(17, posMsgList.Count);
            Assert.AreEqual("set", posMsgList[0]);
            Assert.AreEqual(p.SessionId, posMsgList[1]);
            Assert.AreEqual(_touchId, posMsgList[2]);
            Assert.AreEqual(_pos.X, posMsgList[3]);
            Assert.AreEqual(_pos.Y, posMsgList[4]);
            Assert.AreEqual((_pos.Z + 1f) * 0.5f, posMsgList[5]);
            Assert.AreEqual(0, posMsgList[6]);
            Assert.AreEqual(0, posMsgList[7]);
            Assert.AreEqual(0, posMsgList[8]);
            Assert.AreEqual(0, posMsgList[9]);
            Assert.AreEqual(0, posMsgList[10]);
            Assert.AreEqual(0, posMsgList[11]);
            Assert.AreEqual(0, posMsgList[12]);
            Assert.AreEqual(0, posMsgList[13]);
            Assert.AreEqual(0, posMsgList[14]);
            Assert.AreEqual(0, posMsgList[15]);
            Assert.AreEqual(0, posMsgList[16]);
            
            var end = msgList[3];
            var endArgs = end.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", end.Address.Value);
            
            Assert.AreEqual(2, endArgs.Count);
            Assert.AreEqual("fseq", endArgs[0]);
            Assert.AreEqual(p.FrameId, endArgs[1]);
        }
        
        [Test]
        public void VerifyCorrectValues20_25D()
        {
            _interactions.Add(
                new Interaction(
                        _pos,
                        InteractionType.Push, 5f)
                    { TouchId = _touchId });

            _config.Interpretation = TuioInterpretation.TouchPoint2DwithPressure;
            
            var p = new TuioParameters("Localhost_234", _config, _interactions, _frameId);

            var result = _builder.CreateTuio20Messages(p, TuioInterpretation.TouchPoint2DwithPressure);

            Assert.IsNotNull(result);

            var msgList = result.ToList();
            Assert.AreEqual(3, msgList.Count);

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.AreEqual("/tuio2/frm", start.Address.Value);
            
            Assert.AreEqual(4, startArgs.Count);
            Assert.AreEqual(_frameId, startArgs[0]);
            Assert.AreEqual(p.Time, startArgs[1]);
            Assert.AreEqual(p.Dimension, startArgs[2]);
            Assert.AreEqual(p.Source, startArgs[3]);
            
            var posMsg = msgList[1];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.AreEqual("/tuio2/ptr", posMsg.Address.Value);
            
            Assert.AreEqual(9, posMsgList.Count);
            Assert.AreEqual(p.SessionId, posMsgList[0]);
            Assert.AreEqual(1, posMsgList[1]);
            Assert.AreEqual(_touchId, posMsgList[2]);
            Assert.AreEqual(_pos.X, posMsgList[3]);
            Assert.AreEqual(_pos.Y, posMsgList[4]);
            Assert.AreEqual(0, posMsgList[5]);
            Assert.AreEqual(0, posMsgList[6]);
            Assert.AreEqual(1f, posMsgList[7]);
            Assert.AreEqual(_pos.Z, posMsgList[8]);
            
            var alive = msgList[2];
            var aliveArgs = alive.Arguments.ToList();
            Assert.AreEqual("/tuio2/alv", alive.Address.Value);
            
            Assert.AreEqual(1, aliveArgs.Count);
            Assert.AreEqual(p.SessionId, aliveArgs[0]);
        }
        
        [Test]
        public void VerifyCorrectValues20_3D()
        {
            _interactions.Add(
                new Interaction(
                        _pos,
                        InteractionType.Push, 5f)
                    { TouchId = _touchId });

            _config.Interpretation = TuioInterpretation.Point3D;
            
            var p = new TuioParameters("Localhost_abc", _config, _interactions, _frameId);

            var result = _builder.CreateTuio20Messages(p, TuioInterpretation.Point3D);

            Assert.IsNotNull(result);

            var msgList = result.ToList();
            Assert.AreEqual(3, msgList.Count);

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.AreEqual("/tuio2/frm", start.Address.Value);
            
            Assert.AreEqual(4, startArgs.Count);
            Assert.AreEqual(_frameId, startArgs[0]);
            Assert.AreEqual(p.Time, startArgs[1]);
            Assert.AreEqual(p.Dimension, startArgs[2]);
            Assert.AreEqual(p.Source, startArgs[3]);
            
            var posMsg = msgList[1];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.AreEqual("/tuio2/p3d", posMsg.Address.Value);
            
            Assert.AreEqual(10, posMsgList.Count);
            Assert.AreEqual(p.SessionId, posMsgList[0]);
            Assert.AreEqual(1, posMsgList[1]);
            Assert.AreEqual(_touchId, posMsgList[2]);
            Assert.AreEqual(_pos.X, posMsgList[3]);
            Assert.AreEqual(_pos.Y, posMsgList[4]);
            Assert.AreEqual(( _pos.Z + 1.0f) * 0.5f, posMsgList[5]);
            Assert.AreEqual(0, posMsgList[6]);
            Assert.AreEqual(0, posMsgList[7]);
            Assert.AreEqual(1f, posMsgList[8]);
            Assert.AreEqual(1f, posMsgList[9]);
            
            var alive = msgList[2];
            var aliveArgs = alive.Arguments.ToList();
            Assert.AreEqual("/tuio2/alv", alive.Address.Value);
            
            Assert.AreEqual(1, aliveArgs.Count);
            Assert.AreEqual(p.SessionId, aliveArgs[0]);
        }
        
        [Test]
        public void VerifyCorrectValues20_EmptyInteraction()
        {
            _config.Interpretation = TuioInterpretation.TouchPoint2DwithPressure;
            
            var p = new TuioParameters("Localhost_234", _config, _interactions, _frameId);

            var result = _builder.CreateTuio20Messages(p, TuioInterpretation.TouchPoint2DwithPressure);

            Assert.IsNotNull(result);

            var msgList = result.ToList();
            Assert.AreEqual(2, msgList.Count);

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.AreEqual("/tuio2/frm", start.Address.Value);
            
            Assert.AreEqual(4, startArgs.Count);
            Assert.AreEqual(_frameId, startArgs[0]);
            Assert.AreEqual(p.Time, startArgs[1]);
            Assert.AreEqual(p.Dimension, startArgs[2]);
            Assert.AreEqual(p.Source, startArgs[3]);
            
            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.AreEqual("/tuio2/alv", alive.Address.Value);
            
            Assert.AreEqual(1, aliveArgs.Count);
            Assert.AreEqual(p.SessionId, aliveArgs[0]);
        }
        
        [Test]
        public void VerifyCorrectValues11_Empty()
        {
            _config.Interpretation = TuioInterpretation.Point3D;

             var p = new TuioParameters("Localhost_11-3D", _config, _interactions, _frameId);
         
            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.Point3D);

            Assert.IsNotNull(result);

            var msgList = result.ToList();
            Assert.AreEqual(3, msgList.Count);

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", start.Address.Value);
            
            Assert.AreEqual(2, startArgs.Count);
            Assert.AreEqual("source", startArgs[0]);
            Assert.AreEqual(p.Source, startArgs[1]);

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", alive.Address.Value);
            
            Assert.AreEqual(2, aliveArgs.Count);
            Assert.AreEqual("alive", aliveArgs[0]);
            Assert.AreEqual(p.SessionId, aliveArgs[1]);
            
            var end = msgList[2];
            var endArgs = end.Arguments.ToList();
            Assert.AreEqual("/tuio/3Dobj", end.Address.Value);
            
            Assert.AreEqual(2, endArgs.Count);
            Assert.AreEqual("fseq", endArgs[0]);
            Assert.AreEqual(p.FrameId, endArgs[1]);
        }
    }
}