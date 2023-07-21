using System.Threading;
using System.Threading.Tasks;
using CoreOSC;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Test.Mocks
{
    /// <summary>
    /// Mocking 7 Test Class for simulating busy waiting when sending messages.
    /// Enables to send several messages in parallel and control blocking by resetting <see cref="StopWaiting"/> property.
    /// </summary>
    public class BusyWaitingTuioSender : ITuioSender
    {
        /// <summary>
        /// Stop the blocking of <see cref="Send"/> Task
        /// </summary>
        public void StopWaiting()
        {
            IsWaiting = false;
        }

        /// <summary>
        /// Resets blocking state.
        /// </summary>
        /// <param name="config">can be omitted, is ignored.</param>
        public void Initialize(TuioConfiguration config)
        {
            StopWaiting();
        }

        /// <summary>
        /// always true
        /// </summary>
        public bool IsInitialized => true;

        /// <summary>
        /// Property to control blockade of sending Task.
        /// </summary>
        public bool IsWaiting { get; private set; }

        /// <summary>
        /// Delegates Execution to <see cref="Send"/> method.
        /// </summary>
        /// <param name="bundle">is ignored.</param>
        public async Task SendUdp(OscBundle bundle)
        {
            await Send();
        }

        /// <summary>
        /// Delegates Execution to <see cref="Send"/> method.
        /// </summary>
        /// <param name="bundle">is ignored.</param>
        public async Task SendTcp(OscBundle bundle)
        {
            await Send();
        }

        /// <summary>
        /// Delegates Execution to <see cref="Send"/> method.
        /// </summary>
        /// <param name="bundle">is ignored.</param>
        public async Task SendWebSocket(OscBundle bundle)
        {
            await Send();
        }

        /// <summary>
        /// Stops waiting and therefore enables finishing execution.
        /// </summary>
        /// <returns><see cref="Task.CompletedTask"/></returns>
        public Task StopAllConnections()
        {
            StopWaiting();
            
            return Task.CompletedTask;
        }

        /// <summary>
        /// implements busy waiting as long as <see cref="IsWaiting"/> is true. Thread Sleeps for 100ms (means: status is updated every 100ms)
        /// </summary>
        private async Task Send()
        {
            IsWaiting = true;

            while (IsWaiting)
            {
                await Task.Run(() => Thread.Sleep(100));
            }
        }
    }
}