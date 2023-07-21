using CommandLine;
using ReFlex.Core.Tuio.Util;

namespace TuioTestClientConsole
{
    public class ProgramOptions
    {
        [Option('i', "interpretation", Required = false, HelpText = "Set the TUIO Interpretation: 0 = 2.5D Pointer, 1 = 3D Pointer")]
        public TuioInterpretation? Interpretation { get; set; }
        
        [Option('p', "protocol", Required = false, HelpText = "Set the TUIO protocol version: 0 = TUIO 1.1, 1 = TUIO 2.0")]
        public ProtocolVersion? Protocol { get; set; }
        
        [Option('t', "transport", Required = false, HelpText = "Set the Transport protocol: 0 = UDP, 1 = TCP, 2 = WebSockets")]
        public TransportProtocol? Transport { get; set; }
    }
}