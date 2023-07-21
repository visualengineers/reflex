using System;
using System.Collections.Generic;
using System.Linq;
using CoreOSC;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Components
{
    /// <summary>
    /// Constructs Messages according to either TUIO 1.1 or TUIO 2.0 specification.
    /// </summary>
    public class TuioMessageBuilder : ITuioMessageBuilder
    {
        /// <summary>
        /// creates the messages for the tuio bundle according to TUIO 2.0 specification <see cref="http://www.tuio.org/?tuio20"/>
        /// Bundle contains:
        ///
        /// in case of <see cref="interpretation"/> = <see cref="TuioInterpretation.Point3D"/>:
        /// <code>
        /// [1] /tuio2/frm frame_id time dimension source
        /// [2] /tuio2/p3d session_id 1 touch_id pos_x pos_y pos_z 0 0 1 1 
        /// ...
        /// [n] /tuio2/alv session_id
        /// </code>
        ///
        /// in case of <see cref="interpretation"/> = <see cref="TuioInterpretation.TouchPoint2DwithPressure"/>:
        /// <code>
        /// [1] /tuio2/frm frame_id time dimension source
        /// [2] /tuio2/ptr session_id 1 touch_id pos_x pos_y 0 0 1 pos_z
        /// ...
        /// [n] /tuio2/alv session_id
        /// </code>
        /// </summary>
        /// <param name="parameters"><see cref="TuioParameters"/> containing interactions of current frame and other metadata</param>
        /// <param name="interpretation"><see cref="TuioInterpretation"/> specifying the message format.</param>
        /// <returns>List of all <see cref="OscMessage"/> to create bundle for transfer to TUIO server</returns>
        public IEnumerable<OscMessage> CreateTuio20Messages(TuioParameters parameters, TuioInterpretation interpretation)
        {
            var messages = new List<OscMessage>();
            
            var messageFrame = new OscMessage(
                address: new Address("/tuio2/frm"),
                arguments: new object[]
                {
                     parameters.FrameId,
                     parameters.Time,
                     parameters.Dimension,
                     parameters.Source
                });
            
            messages.Add(messageFrame);

            var posAddress = interpretation == TuioInterpretation.Point3D
                ? "/tuio2/p3d"
                : "/tuio2/ptr";
            
            foreach (var pos in parameters.Positions)
            {
                var arguments = interpretation == TuioInterpretation.Point3D
                    ? 
                        new object[]
                        {
                            parameters.SessionId,       // session_id
                            1,                          // tu_id --> unknown finger == right index finger
                            pos.Item1,                  // c_id = touch id
                            pos.Item2,                  // x_pos
                            pos.Item3,                  // y_pos
                            pos.Item4,                  // z_pos
                            0.0f,                       // x_axis
                            0.0f,                       // y_axis
                            1.0f,                       // z_axis --> [0,0,-1] -> pointing towards sensor
                            1f                          // radius: 1
                        }
                    :
                        new object[]
                         {
                             parameters.SessionId,   // sessionId
                             1,                      // tu_id --> unknown finger == right index finger
                             pos.Item1,              // c_id = touch id
                             pos.Item2,              // x_pos
                             pos.Item3,              // y_pos
                             0.0f,                   // angle
                             0.0f,                   // shear
                             1f,                     // radius: 1
                             pos.Item4,              // pressure: [-1|1]
                         };
               var interactionMessage = new OscMessage(
                    address: new Address(posAddress),
                    arguments: arguments);

               messages.Add(interactionMessage);
            }
            
            var messageAlive = new OscMessage(
                address: new Address("/tuio2/alv"),
                arguments: new object[]
                {
                    parameters.SessionId
                });
            
            messages.Add(messageAlive);

            return messages;
        }

        /// <summary>
        /// creates the messages for the tuio bundle according to TUIO 1.1 specification <see cref="http://www.tuio.org/?specification"/>
        /// Bundle contains:
        /// 
        /// in case of <see cref="interpretation"/> = <see cref="TuioInterpretation.Point3D"/>:
        /// <code>
        /// [1] /tuio2/3Dobj "source" source
        /// [2] /tuio2/3Dobj "alive" session_id
        /// [3] /tuio2/3Dobj "set" session_id touch_id pos_x pos_y pos_z 0 0 0 0 0 0 0 0 0 0 0 
        /// ...
        /// [n] /tuio2/3Dobj "fseq" frame_id
        /// </code>
        /// 
        /// in case of <see cref="interpretation"/> = <see cref="TuioInterpretation.TouchPoint2DwithPressure"/>
        /// <code>
        /// [1] /tuio2/25Dobj "source" source
        /// [2] /tuio2/25Dobj "alive" session_id
        /// [3] /tuio2/25Dobj "set" session_id touch_id pos_x pos_y pos_z 0 0 0 0 0 0 0 
        /// ...
        /// [n] /tuio2/25Dobj "fseq" frame_id
        /// </code>
        /// </summary>
        /// <param name="parameters"><see cref="TuioParameters"/> containing interactions of current frame and other metadata</param>
        /// <param name="interpretation"><see cref="TuioInterpretation"/> specifying the message format.</param>
        /// <returns>List of all <see cref="OscMessage"/> to create bundle for transfer to TUIO server</returns>
        public IEnumerable<OscMessage> CreateTuio11Messages(TuioParameters parameters, TuioInterpretation interpretation)
        {
             var messages = new List<OscMessage>();

             var address = interpretation == TuioInterpretation.Point3D
                 ? "/tuio/3Dobj"
                 : "/tuio/25Dobj";
            
            var messageStart = new OscMessage(
                address: new Address(address),
                arguments: new object[]
                {
                    "source",                // command parameter 
                    parameters.Source        // identifier
                });
            
            messages.Add(messageStart);
            
            var messageAlive = new OscMessage(
                address: new Address(address),
                arguments: new object[]
                {
                    "alive",                // command parameter 
                    parameters.SessionId    // session id
                });
            
            messages.Add(messageAlive);

            foreach (var pos in parameters.Positions)
            {
                var arguments = interpretation == TuioInterpretation.Point3D
                    ? 
                        new object[]
                        {
                            "set",                      // command parameter 
                            parameters.SessionId,       // s: session_id
                            pos.Item1,                  // i : class id = touch id
                            pos.Item2,                  // x: x_pos
                            pos.Item3,                  // y: y_pos
                            pos.Item4,                  // z: z_pos
                            0.0f,                       // a
                            0.0f,                       // b
                            0.0f,                       // c
                            0f,                         // X (Velocity)
                            0f,                         // Y
                            0f,                         // Z
                            0f,                         // A (Rotation)
                            0f,                         // B
                            0f,                         // C
                            0f,                         // m (Motion acceleration)
                            0f,                         // r (rotation acceleration)
                        }
                    :
                        new object[]
                        {
                            "set",                      // command parameter 
                            parameters.SessionId,       // s: session_id
                            pos.Item1,                  // i : class id = touch id
                            pos.Item2,                  // x: x_pos
                            pos.Item3,                  // y: y_pos
                            pos.Item4,                  // z: z_pos
                            0.0f,                       // a
                            0f,                         // X (Velocity)
                            0f,                         // Y
                            0f,                         // Z
                            0f,                         // A (Rotation)
                            0f,                         // m (Motion acceleration)
                            0f,                         // r (rotation acceleration)
                        };
               var interactionMessage = new OscMessage(
                    address: new Address(address),
                    arguments: arguments);

               messages.Add(interactionMessage);
            }
            
            var messageEnd = new OscMessage(
                address: new Address(address),
                arguments: new object[]
                {
                    "fseq",             // command parameter 
                    parameters.FrameId  // frame id
                });
            
            messages.Add(messageEnd);

            return messages;
        }
        
        public string GenerateStringRepresentation(OscBundle bundle)
        {
            return GenerateStringRepresentation(bundle.Messages);
        }

        public string GenerateStringRepresentation(IEnumerable<OscMessage> messages)
        {
            if (messages == null)
                return "";
            
            var msgList = messages.ToList();
            var result = "";
            for (var i = 0; i < msgList.Count(); i++)
            {
                result += $"{GenerateStringRepresentation(msgList[i], i + 1)}{Environment.NewLine}";
            }

            return result;
        }

        private string GenerateStringRepresentation(OscMessage msg, int index)
        {
            var args = msg.Arguments.ToList();
            var result = args.Count > 0 ? $"{Environment.NewLine}" : "";
            args.ForEach(arg =>
            {
                var argStr = arg.ToString();
                if (arg is Timetag)
                    argStr = ((Timetag)arg).Tag.ToString();
                result += $"          {argStr} : ({arg.GetType().Name}) {Environment.NewLine}";
            });

            return $"[{index}] \"{msg.Address.Value}\"{result}";
        }
    }
}