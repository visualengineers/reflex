using System.Collections.Generic;
using CoreOSC;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Interfaces
{
    /// <summary>
    /// Interface for constructing <see cref="OscMessage"/> according to TUIO specification
    /// </summary>
    public interface ITuioMessageBuilder
    {
        /// <summary>
        /// construct <see cref="OscMessage"/> according to TUIO 1.1 specification
        /// </summary>
        /// <param name="parameters">contain interactions and metadata</param>
        /// <param name="interpretation"><see cref="TuioInterpretation"/> specifying the message format</param>
        /// <returns>List of <see cref="OscMessage"/> for transfer to TUIO server</returns>
        IEnumerable<OscMessage> CreateTuio11Messages(TuioParameters parameters, TuioInterpretation interpretation);
        
        /// <summary>
        /// construct <see cref="OscMessage"/> according to TUIO 2.0 specification
        /// </summary>
        /// <param name="parameters">contain interactions and metadata</param>
        /// <param name="interpretation"><see cref="TuioInterpretation"/> specifying the message format</param>
        /// <returns>List of <see cref="OscMessage"/> for transfer to TUIO server</returns>
        IEnumerable<OscMessage> CreateTuio20Messages(TuioParameters parameters, TuioInterpretation interpretation);

        string GenerateStringRepresentation(OscBundle bundle);

        string GenerateStringRepresentation(IEnumerable<OscMessage> messages);
    }
}