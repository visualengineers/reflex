using System;
using System.Collections.Generic;
using CoreOSC;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Tuio.Util
{
    /// <summary>
    /// Data Storage to build <see cref="OscBundle"/> for TUIO Communication
    /// </summary>
    public class TuioParameters
    {
        /// <summary>
        /// Dimension (in /tuio2/frm)
        /// </summary>
        public int Dimension { get; }
        /// <summary>
        /// Source (in /tuio2/frm and "source" property in TUIO 1.1)
        /// </summary>
        public string Source { get; }
        /// <summary>
        /// Session Id for alive messages
        /// </summary>
        public int SessionId { get;  }
        
        /// <summary>
        /// FrameId (in /tuio2/frm and "fseq" property in TUIO 1.1)
        /// </summary>
        public int FrameId { get; }
        
        
        /// <summary>
        /// Time for Bundle and in /tuio2/frm
        /// </summary>
        public Timetag Time { get; }

        /// <summary>
        /// Contains List of Interaction with Position and TouchId in the Foomat: [Item1, Item2, Item3, Item4] = [TouchId, PosX, PosY, PosZ] 
        /// </summary>
        public List<Tuple<int, float, float, float>> Positions { get; } = new List<Tuple<int, float, float, float>>();

        ///  <summary>
        ///  Constructs Parameters.
        ///  <see cref="Time"/> is derived from <see><cref>DateTime.Now.Ticks</cref></see>
        ///  <see cref="Dimension"/> is computed from <see cref="TuioConfiguration.SensorWidth"/> * <see cref="TuioConfiguration.SensorHeight"/> 
        /// <see cref="Source"/> is $"ReFlex@{clientAddress} [{config.SensorDescription}]"
        ///  For each interaction, the Coordinates are transformed, if the provided <see cref="TuioInterpretation"/> is <see cref="TuioInterpretation.Point3D"/>:
        ///  Position.Z = (Position.Z + 1) / 2 (to fit from [-1 | 1] ]in the range [0.0. | 1.0 ] with 0.0 -> 0.5
        ///  </summary>
        ///  <param name="clientAddress">IP Address for specifying the Source</param>
        ///  <param name="config">for computing dimension and transformation of coordinates</param>
        ///  <param name="interactions">interactions from Reflex server, transformed and stored in <see cref="Positions"/></param>
        ///  <param name="frameId">frame Id for TUIO message bundle. used to maintain correct order of messages</param>
        public TuioParameters(string clientAddress, TuioConfiguration config, List<Interaction> interactions, int frameId)
        {
            Time = new Timetag((ulong)DateTime.Now.Ticks);
            Dimension = config.SensorWidth * config.SensorHeight;
            Source = $"ReFlex@{clientAddress} [{config.SensorDescription}]";
            SessionId = config.SessionId;
            FrameId = frameId;
            
            interactions.ForEach(interaction =>
            {
                var xPos = interaction.Position.X;
                var yPos = interaction.Position.Y;
                var zPos = interaction.Position.Z;

                if (config.Interpretation == TuioInterpretation.Point3D)
                    zPos = (zPos + 1.0f) * 0.5f; // decode range [-1.0 | 1.0] into [0.0. | 1.0 ] with 0.0 -> 0.5
                
                Positions.Add(new Tuple<int, float, float, float>(interaction.TouchId, xPos, yPos, zPos));
            });
        }
    }
}