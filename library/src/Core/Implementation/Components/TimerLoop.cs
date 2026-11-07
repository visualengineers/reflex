using System;
using System.Threading;
using System.Collections.Generic;
using System.Linq;
using System.Timers;
using Implementation.Interfaces;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace Implementation.Components
{
    public class TimerLoop : ITimerLoop
    {
        private readonly INetworkManager _networkManager;
        private readonly IInteractionManager _interactionManager;
        private readonly ICalibrationManager _calibrationManager;
        private readonly System.Timers.Timer _timer;

        private int _interactionsProcessing;

        public event EventHandler<bool> IsLoopRunningChanged;

        public int IntervalLength { get; set; } = 100;

        public bool IsLoopRunning
        {
            get => _timer != null && _timer.Enabled;
            set
            {
                if (value)
                    Run();
                else
                    Stop();
            }
        }

        public TimerLoop(INetworkManager networkManager, IInteractionManager interactionManager,
            ICalibrationManager calibrationManager)
        {
            _networkManager = networkManager;
            _interactionManager = interactionManager;
            _calibrationManager = calibrationManager;
            _timer = new System.Timers.Timer(IntervalLength);

        }

        public void Run()
        {
            if (_networkManager is null || _timer.Enabled)
                return;

            _timer.Interval = IntervalLength;
            _timer.AutoReset = true;
            _timer.Elapsed += OnTimerTick;
            _timer.Start();
            IsLoopRunningChanged?.Invoke(this, true);
        }

        public void Stop()
        {
            if (_timer is null || !_timer.Enabled)
                return;

            _timer.Stop();
            _timer.Elapsed -= OnTimerTick;
            IsLoopRunningChanged?.Invoke(this, false);
        }

        private async void OnTimerTick(object sender, EventArgs args)
        {
            if (_interactionManager == null) return;
            if (Interlocked.CompareExchange(ref _interactionsProcessing, 1, 0) != 0)
            {
                // A stalled remote request must not stall expiry or keep broadcasting stale touches.
                try { _interactionManager.AdvanceTime(); BroadcastCurrent(); }
                catch (Exception exception) { NLog.LogManager.GetCurrentClassLogger().Error(exception); }
                return;
            }
            try
            {
                await _interactionManager.Update();
                BroadcastCurrent();
            }
            catch (Exception exception) { NLog.LogManager.GetCurrentClassLogger().Error(exception); }
            finally { Volatile.Write(ref _interactionsProcessing, 0); }
        }

        private void BroadcastCurrent()
        {
            var stream = _interactionManager.Interactions.Select(item => new Interaction(item)).ToList();
            for (var i = 0; i < stream.Count; i++)
                stream[i] = _calibrationManager?.Calibrate(stream[i]) ?? stream[i];
            _networkManager?.Broadcast(stream);
        }
    }
}
