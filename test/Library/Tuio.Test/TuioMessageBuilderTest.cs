using System;
using System.Collections.Generic;
using System.Linq;
using CoreOSC;
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

            var oscMessages = result as OscMessage[] ?? result.ToArray();
            Assert.That(oscMessages, Is.Not.Null);

            Assert.That(oscMessages.ToList().Count, Is.EqualTo(3));
        }

        [Test]
        public void TestSingleInteraction11()
        {
            _interactions.Add(new Interaction(new Point3(1f, 0.5f, -0.5f), InteractionType.Push, 5f) { TouchId = 1 });

            var p = new TuioParameters("Localhost", _config, _interactions, 1);

            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.Point3D);

            var oscMessages = result as OscMessage[] ?? result.ToArray();
            Assert.That(oscMessages, Is.Not.Null);

            Assert.That(oscMessages.ToList().Count, Is.EqualTo(4));
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

            Assert.That(result, Is.Not.Null);

            var msgList = result.ToList();

            Assert.That(msgList.Count, Is.EqualTo(2 + num));

            for (var i = 0; i < num + 2; i++)
            {
                var start = msgList[i];
                if (i == 0)
                    Assert.That(start.Address.Value, Is.EqualTo("/tuio2/frm"));
                else if (i == num + 1)
                    Assert.That(start.Address.Value, Is.EqualTo("/tuio2/alv"));
                else
                    Assert.That(start.Address.Value, Is.EqualTo("/tuio2/ptr"));
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

            var oscMessages = result as OscMessage[] ?? result.ToArray();
            Assert.That(oscMessages, Is.Not.Null);
            
            var msgList = oscMessages.ToList();

            Assert.That(msgList.Count, Is.EqualTo(3 + num));
            
            for (var i = 0; i < num + 3; i++)
            {
                var start = msgList[i];
                var args = start.Arguments.ToList();
                Assert.That(start.Address.Value, Is.EqualTo("/tuio/25Dobj"));
                if (i == 0)
                    Assert.That(args[0], Is.EqualTo("source"));
                else if (i == 1)
                    Assert.That(args[0], Is.EqualTo("alive"));
                else if (i == num + 2)
                    Assert.That(args[0], Is.EqualTo("fseq"));
                else
                    Assert.That(args[0], Is.EqualTo("set"));
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

            var oscMessages = result as OscMessage[] ?? result.ToArray();
            Assert.That(oscMessages, Is.Not.Null);

            var msgList = oscMessages.ToList();
            Assert.That(msgList.Count, Is.EqualTo(4));

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(start.Address.Value, Is.EqualTo("/tuio/25Dobj"));

                Assert.That(startArgs, Has.Count.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(startArgs[0], Is.EqualTo("source"));
                Assert.That(startArgs[1], Is.EqualTo(p.Source));
            });

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(alive.Address.Value, Is.EqualTo("/tuio/25Dobj"));

                Assert.That(aliveArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(aliveArgs[0], Is.EqualTo("alive"));
                Assert.That(aliveArgs[1], Is.EqualTo(p.SessionId));
            });

            var posMsg = msgList[2];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(posMsg.Address.Value, Is.EqualTo("/tuio/25Dobj"));

                Assert.That(posMsgList.Count, Is.EqualTo(13));
            });
            Assert.Multiple(() =>
            {
                Assert.That(posMsgList[0], Is.EqualTo("set"));
                Assert.That(posMsgList[1], Is.EqualTo(p.SessionId));
                Assert.That(posMsgList[2], Is.EqualTo(_touchId));
                Assert.That(posMsgList[3], Is.EqualTo(_pos.X));
                Assert.That(posMsgList[4], Is.EqualTo(_pos.Y));
                Assert.That(posMsgList[5], Is.EqualTo(_pos.Z));
                Assert.That(posMsgList[6], Is.EqualTo(0));
                Assert.That(posMsgList[7], Is.EqualTo(0));
                Assert.That(posMsgList[8], Is.EqualTo(0));
                Assert.That(posMsgList[9], Is.EqualTo(0));
                Assert.That(posMsgList[10], Is.EqualTo(0));
                Assert.That(posMsgList[11], Is.EqualTo(0));
                Assert.That(posMsgList[12], Is.EqualTo(0));
            });

            var end = msgList[3];
            var endArgs = end.Arguments.ToList();
            Assert.That(end.Address.Value, Is.EqualTo("/tuio/25Dobj"));

            Assert.That(endArgs.Count, Is.EqualTo(2));
            Assert.That(endArgs[0], Is.EqualTo("fseq"));
            Assert.That(endArgs[1], Is.EqualTo(p.FrameId));
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

            Assert.That(result, Is.Not.Null);

            var msgList = result.ToList();
            Assert.That(msgList.Count, Is.EqualTo(4));

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(start.Address.Value, Is.EqualTo("/tuio/3Dobj"));

                Assert.That(startArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(startArgs[0], Is.EqualTo("source"));
                Assert.That(startArgs[1], Is.EqualTo(p.Source));
            });

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(alive.Address.Value, Is.EqualTo("/tuio/3Dobj"));

                Assert.That(aliveArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(aliveArgs[0], Is.EqualTo("alive"));
                Assert.That(aliveArgs[1], Is.EqualTo(p.SessionId));
            });

            var posMsg = msgList[2];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(posMsg.Address.Value, Is.EqualTo("/tuio/3Dobj"));
                Assert.That(posMsgList.Count, Is.EqualTo(17));
            });
            Assert.Multiple(() =>
            {
                Assert.That(posMsgList[0], Is.EqualTo("set"));
                Assert.That(posMsgList[1], Is.EqualTo(p.SessionId));
                Assert.That(posMsgList[2], Is.EqualTo(_touchId));
                Assert.That(posMsgList[3], Is.EqualTo(_pos.X));
                Assert.That(posMsgList[4], Is.EqualTo(_pos.Y));
                Assert.That(posMsgList[5], Is.EqualTo((_pos.Z + 1f) * 0.5f));
                Assert.That(posMsgList[6], Is.EqualTo(0));
                Assert.That(posMsgList[7], Is.EqualTo(0));
                Assert.That(posMsgList[8], Is.EqualTo(0));
                Assert.That(posMsgList[9], Is.EqualTo(0));
                Assert.That(posMsgList[10], Is.EqualTo(0));
                Assert.That(posMsgList[11], Is.EqualTo(0));
                Assert.That(posMsgList[12], Is.EqualTo(0));
                Assert.That(posMsgList[13], Is.EqualTo(0));
                Assert.That(posMsgList[14], Is.EqualTo(0));
                Assert.That(posMsgList[15], Is.EqualTo(0));
                Assert.That(posMsgList[16], Is.EqualTo(0));
            });

            var end = msgList[3];
            var endArgs = end.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(end.Address.Value, Is.EqualTo("/tuio/3Dobj"));

                Assert.That(endArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(endArgs[0], Is.EqualTo("fseq"));
                Assert.That(endArgs[1], Is.EqualTo(p.FrameId));
            });
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

            Assert.That(result, Is.Not.Null);

            var msgList = result.ToList();
            Assert.That(msgList.Count, Is.EqualTo(3));

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(start.Address.Value, Is.EqualTo("/tuio2/frm"));

                Assert.That(startArgs.Count, Is.EqualTo(4));
            });
            Assert.Multiple(() =>
            {
                Assert.That(startArgs[0], Is.EqualTo(_frameId));
                Assert.That(startArgs[1], Is.EqualTo(p.Time));
                Assert.That(startArgs[2], Is.EqualTo(p.Dimension));
                Assert.That(startArgs[3], Is.EqualTo(p.Source));
            });

            var posMsg = msgList[1];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(posMsg.Address.Value, Is.EqualTo("/tuio2/ptr"));

                Assert.That(posMsgList.Count, Is.EqualTo(9));
            });
            Assert.Multiple(() =>
            {
                Assert.That(posMsgList[0], Is.EqualTo(p.SessionId));
                Assert.That(posMsgList[1], Is.EqualTo(1));
                Assert.That(posMsgList[2], Is.EqualTo(_touchId));
                Assert.That(posMsgList[3], Is.EqualTo(_pos.X));
                Assert.That(posMsgList[4], Is.EqualTo(_pos.Y));
                Assert.That(posMsgList[5], Is.EqualTo(0));
                Assert.That(posMsgList[6], Is.EqualTo(0));
                Assert.That(posMsgList[7], Is.EqualTo(1f));
                Assert.That(posMsgList[8], Is.EqualTo(_pos.Z));
            });

            var alive = msgList[2];
            var aliveArgs = alive.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(alive.Address.Value, Is.EqualTo("/tuio2/alv"));

                Assert.That(aliveArgs.Count, Is.EqualTo(1));
            });
            Assert.That(aliveArgs[0], Is.EqualTo(p.SessionId));
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

            Assert.That(result, Is.Not.Null);

            var msgList = result.ToList();
            Assert.That(msgList.Count, Is.EqualTo(3));

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(start.Address.Value, Is.EqualTo("/tuio2/frm"));

                Assert.That(startArgs.Count, Is.EqualTo(4));
            });
            Assert.Multiple(() =>
            {
                Assert.That(startArgs[0], Is.EqualTo(_frameId));
                Assert.That(startArgs[1], Is.EqualTo(p.Time));
                Assert.That(startArgs[2], Is.EqualTo(p.Dimension));
                Assert.That(startArgs[3], Is.EqualTo(p.Source));
            });

            var posMsg = msgList[1];
            var posMsgList = posMsg.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(posMsg.Address.Value, Is.EqualTo("/tuio2/p3d"));

                Assert.That(posMsgList.Count, Is.EqualTo(10));
            });
            Assert.Multiple(() =>
            {
                Assert.That(posMsgList[0], Is.EqualTo(p.SessionId));
                Assert.That(posMsgList[1], Is.EqualTo(1));
                Assert.That(posMsgList[2], Is.EqualTo(_touchId));
                Assert.That(posMsgList[3], Is.EqualTo(_pos.X));
                Assert.That(posMsgList[4], Is.EqualTo(_pos.Y));
                Assert.That(posMsgList[5], Is.EqualTo((_pos.Z + 1.0f) * 0.5f));
                Assert.That(posMsgList[6], Is.EqualTo(0));
                Assert.That(posMsgList[7], Is.EqualTo(0));
                Assert.That(posMsgList[8], Is.EqualTo(1f));
                Assert.That(posMsgList[9], Is.EqualTo(1f));
            });

            var alive = msgList[2];
            var aliveArgs = alive.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(alive.Address.Value, Is.EqualTo("/tuio2/alv"));

                Assert.That(aliveArgs.Count, Is.EqualTo(1));
            });
            Assert.That(aliveArgs[0], Is.EqualTo(p.SessionId));
        }
        
        [Test]
        public void VerifyCorrectValues20_EmptyInteraction()
        {
            _config.Interpretation = TuioInterpretation.TouchPoint2DwithPressure;
            
            var p = new TuioParameters("Localhost_234", _config, _interactions, _frameId);

            var result = _builder.CreateTuio20Messages(p, TuioInterpretation.TouchPoint2DwithPressure);

            Assert.That(result, Is.Not.Null);

            var msgList = result.ToList();
            Assert.That(msgList.Count, Is.EqualTo(2));

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(start.Address.Value, Is.EqualTo("/tuio2/frm"));

                Assert.That(startArgs.Count, Is.EqualTo(4));
            });
            Assert.Multiple(() =>
            {
                Assert.That(startArgs[0], Is.EqualTo(_frameId));
                Assert.That(startArgs[1], Is.EqualTo(p.Time));
                Assert.That(startArgs[2], Is.EqualTo(p.Dimension));
                Assert.That(startArgs[3], Is.EqualTo(p.Source));
            });

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(alive.Address.Value, Is.EqualTo("/tuio2/alv"));

                Assert.That(aliveArgs.Count, Is.EqualTo(1));
            });
            Assert.That(aliveArgs[0], Is.EqualTo(p.SessionId));
        }
        
        [Test]
        public void VerifyCorrectValues11_Empty()
        {
            _config.Interpretation = TuioInterpretation.Point3D;

             var p = new TuioParameters("Localhost_11-3D", _config, _interactions, _frameId);
         
            var result = _builder.CreateTuio11Messages(p, TuioInterpretation.Point3D);

            Assert.That(result, Is.Not.Null);

            var msgList = result.ToList();
            Assert.That(msgList.Count, Is.EqualTo(3));

            var start = msgList[0];
            var startArgs = start.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(start.Address.Value, Is.EqualTo("/tuio/3Dobj"));

                Assert.That(startArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(startArgs[0], Is.EqualTo("source"));
                Assert.That(startArgs[1], Is.EqualTo(p.Source));
            });

            var alive = msgList[1];
            var aliveArgs = alive.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(alive.Address.Value, Is.EqualTo("/tuio/3Dobj"));

                Assert.That(aliveArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(aliveArgs[0], Is.EqualTo("alive"));
                Assert.That(aliveArgs[1], Is.EqualTo(p.SessionId));
            });

            var end = msgList[2];
            var endArgs = end.Arguments.ToList();
            Assert.Multiple(() =>
            {
                Assert.That(end.Address.Value, Is.EqualTo("/tuio/3Dobj"));

                Assert.That(endArgs.Count, Is.EqualTo(2));
            });
            Assert.Multiple(() =>
            {
                Assert.That(endArgs[0], Is.EqualTo("fseq"));
                Assert.That(endArgs[1], Is.EqualTo(p.FrameId));
            });
        }
    }
}