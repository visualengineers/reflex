using System.Collections.Generic;
using System.Threading.Tasks;
using CoreOSC;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Interfaces
{
    /// <summary>
    /// Broadcast service for transferring ReFlex interactions in TUIO format.
    /// </summary>
    public interface ITuioBroadcast
    {
        /// <summary>
        /// Specify whether the instance has a valid configuration
        /// </summary>
        bool IsConfigured { get; }

        /// <summary>
        /// Specifies whether the service is currently sending data. 
        /// </summary>
        bool IsSending { get; }

        /// <summary>
        /// Current Configuration for sending
        /// </summary>
        TuioConfiguration Configuration { get; }
        
        /// <summary>
        /// Get current Frame Id
        /// </summary>
        int FrameId { get; }

        /// <summary>
        /// Initializes the service with the provided configuration.
        /// </summary>
        /// <param name="config">Configuration containing (at least) server address, port and <see cref="TransportProtocol"/></param>
        /// <returns>completed Task</returns>
        Task Configure(TuioConfiguration config);

        /// <summary>
        /// Broadcast data according to the current configuration to TUIO server
        /// </summary>
        /// <param name="interactions">interactions that are transformed into TUIO packages</param>
        /// <returns>string representation of transmitted <see cref="OscBundle"/></returns>
        Task<string> Broadcast(List<Interaction> interactions);
    }
}