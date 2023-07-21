using System.Windows.Input;
using Implementation.Interfaces;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Core.Common.Util;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class TimerLoopViewModel : BindableBase
    {
        private readonly ITimerLoop _loop;
        private readonly IEventAggregator _eventAggregator;
        private readonly IInteractionManager _interactionManager;
        private Settings _settings;
        private int _intervalLength;
        private ObserverType _type;
        private bool _isLoopRunning;

        public int IntervalLength
        {
            get
            {
                if (_loop != null)
                    _intervalLength = _loop.IntervalLength;

                return _intervalLength;
            }
            set
            {
                if (_loop != null)
                    _loop.IntervalLength = value;

                SetProperty(ref _intervalLength, value);
            }
        }

        public ObserverType Type
        {
            get
            {
                if (_interactionManager != null)
                    _type = _interactionManager.Type;

                return _type;
            }
            set
            {
                if (_interactionManager != null && _type != value)
                {
                    IsLoopRunning = false;
                    _interactionManager.Type = value;
                }

                Settings.Default.InteractionType = value;
                Settings.Default.Save();

                SetProperty(ref _type, value);
            }
        }

        public bool IsLoopRunning
        {
            get
            {
                if (_loop != null)
                    _isLoopRunning = _loop.IsLoopRunning;

                return _isLoopRunning;
            }
            set
            {
                if (_loop != null)
                    _loop.IsLoopRunning = value;

                SetProperty(ref _isLoopRunning, value);
            }
        }

        public ICommand ToggleLoopCommand { get; }

        public TimerLoopViewModel(ITimerLoop loop, IInteractionManager interactionManager, IEventAggregator eventAggregator)
        {
            _loop = loop;
            _interactionManager = interactionManager;
            _eventAggregator = eventAggregator;

            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);

            ToggleLoopCommand = new DelegateCommand(ToggleLoop);

            LoadSettings();
        }

        private void ToggleLoop() => IsLoopRunning = !IsLoopRunning;

        private void LoadSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            IntervalLength = _settings.IntervalDuration;

            if (_settings.IsAutoStartEnabled)
                IsLoopRunning = true;
        }

        private void SaveSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            _settings.IntervalDuration = IntervalLength;
            _settings.Save();
        }

        public void Dispose()
        {
            _eventAggregator?.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
            _eventAggregator?.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
        }
    }
}
