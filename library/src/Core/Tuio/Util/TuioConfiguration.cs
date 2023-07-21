using System;
using System.ComponentModel;
using System.Configuration;
using Newtonsoft.Json;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Tuio.Util
{
    /// <summary>
    /// Storage class for all "static" values needed to establish TUIO communication.
    /// Includes Meta data about Sensor, Connection and Message Encoding.
    /// </summary>
    public class TuioConfiguration
    {
        /// <summary>
        /// Horizontal Pixel Resolution of the Sensor for computation of Dimension
        /// </summary>
        public int SensorWidth { get; set; }

        /// <summary>
        /// Vertical Pixel Resolution of the Sensor for computation of Dimension
        /// </summary>
        public int SensorHeight { get; set; }

        /// <summary>
        /// Name of the Sensor for Specifying the Source.
        /// </summary>
        public string SensorDescription { get; set; }

        /// <summary>
        /// Session Id for Alive Messages.
        /// </summary>
        public int SessionId { get; set; }

        /// <summary>
        /// IP of the TUIO Server. Default: "127.0.0.1".
        /// </summary>
        public string ServerAddress { get; set; } = "127.0.0.1";

        /// <summary>
        /// Port number for the TUIO Server. Default: 3333
        /// </summary>
        public int ServerPort { get; set; } = 3333;

        /// <summary>
        /// Specify which Message Format will be used. Default: <see cref="ProtocolVersion.TUIO_VERSION_2_0"/>
        /// </summary>
        public ProtocolVersion Protocol { get; set; } = ProtocolVersion.TUIO_VERSION_2_0;

        /// <summary>
        /// Specify which Transport Protocol to be used for communication with the TUIO Server. Default: <see cref="TransportProtocol.Udp"/>
        /// </summary>
        public TransportProtocol Transport { get; set; } = TransportProtocol.Udp;

        /// <summary>
        /// Specify which TUIO Type is used to encode the ReFelx interactions. Default: <see cref="TuioInterpretation.TouchPoint2DwithPressure"/>
        /// </summary>
        public TuioInterpretation Interpretation { get; set; } = TuioInterpretation.TouchPoint2DwithPressure;

        /// <summary>
        /// For logging purposes, this returns a well-formed extended string representation of the instance, containing values for all properties.
        /// </summary>
        public string GetTuioConfigurationString()
        {
            var result = $"=====  {nameof(TuioConfiguration)}  ====={Environment.NewLine}";
            result += $"  {nameof(SessionId)}: {SessionId}{Environment.NewLine}";
            result +=
                $"  {nameof(SensorDescription)}: {SensorDescription ?? "NONE"} ({nameof(SensorWidth)}: {SensorWidth}, {nameof(SensorHeight)}: {SensorHeight} ){Environment.NewLine}";
            result +=
                $"  {nameof(ServerAddress)}: {ServerAddress ?? "NONE"} | {nameof(ServerPort)}: {ServerPort}{Environment.NewLine}";
            result += $"  {nameof(ProtocolVersion)}: {Enum.GetName(typeof(ProtocolVersion), Protocol)}{Environment.NewLine}";
            result +=
                $"  {nameof(TransportProtocol)}: {Enum.GetName(typeof(TransportProtocol), Transport)}{Environment.NewLine}";
            result +=
                $"  {nameof(TuioInterpretation)}: {Enum.GetName(typeof(TuioInterpretation), Interpretation)}{Environment.NewLine}";

            return result;
        }
    }
}
