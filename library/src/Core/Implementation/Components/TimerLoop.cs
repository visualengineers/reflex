using System;
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
        private readonly Timer _timer;

        private bool _interactionsProcessing = false;

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
            _timer = new Timer(IntervalLength);
            _interactionsProcessing = false;
        }

        public void Run()
        {
            _interactionsProcessing = false;
            
            if (_networkManager is null)
                return;

            _timer.Interval = IntervalLength;
            _timer.AutoReset = true;
            _timer.Elapsed += OnTimerTick;
            _timer.Start();
        }

        public void Stop()
        {
            _interactionsProcessing = false;
            if (_timer is null)
                return;

            _timer.Stop();
            _timer.Elapsed -= OnTimerTick;
        }

        private async void OnTimerTick(object sender, EventArgs args)
        {
            if (_interactionManager == null || _interactionsProcessing)
                return;

            _interactionsProcessing = true;

            var updateStatus = await _interactionManager.Update();
            _interactionsProcessing = false;
            if (updateStatus == ProcessServiceStatus.Error)
            {
                
                Stop();
                IsLoopRunningChanged?.Invoke(this, IsLoopRunning);
            }

            var stream = _interactionManager?.Interactions?.ToList();


            if (stream != null)
            {
                for (var i = 0; i < stream.Count; i++)
                    stream[i] = _calibrationManager?.Calibrate(stream[i]);
            }

            _networkManager?.Broadcast(stream ?? new List<Interaction>());
        }
    }
}