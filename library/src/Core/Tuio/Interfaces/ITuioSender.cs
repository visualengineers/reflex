using System.Threading.Tasks;
using CoreOSC;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Interfaces
{
    /// <summary>
    /// Interface for sending TUIO packages to TUIO server using OSC.
    /// </summary>
    public interface ITuioSender
    {
        /// <summary>
        /// Initialize sender specifying server, transport and message format.
        /// </summary>
        /// <param name="config">values containing information about server, transport and message format</param>
        void Initialize(TuioConfiguration config);
        
        /// <summary>
        /// Specifies whether the instance ha a valid configuration
        /// </summary>
        bool IsInitialized { get; }

        /// <summary>
        /// Send data using UDP asynchronously.
        /// </summary>
        /// <param name="bundle">Data to be transferred</param>
        /// <returns>completed task</returns>
        Task SendUdp(OscBundle bundle);
        
        /// <summary>
        /// Send data using TCP asynchronously.
        /// </summary>
        /// <param name="bundle">Data to be transferred</param>
        /// <returns>completed task</returns>
        Task SendTcp(OscBundle bundle);
        
        /// <summary>
        /// Send data using WebSocket protocol asynchronously.
        /// </summary>
        /// <param name="bundle">Data to be transferred</param>
        /// <returns>completed task</returns>
        Task SendWebSocket(OscBundle bundle);

        /// <summary>
        /// Stop and dispose all open connections. Reset <see cref="IsInitialized"/> state.
        /// </summary>
        /// <returns>completed task</returns>
        Task StopAllConnections();
    }
}