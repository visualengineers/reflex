using System;
using System.Windows;
using System.Windows.Input;
using Implementation.Interfaces;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Core.Events;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class FilterViewModel : BindableBase, IDisposable
    {
        private readonly IFilterManager _filterManager;
        private readonly IInteractionManager _interactionManager;
        private readonly IEventAggregator _eventAggregator;
        private Settings _settings;

        private float _threshold;
        private int _boxFilterRadius;
        private float _distance;
        private float _minDistance;
        private float _maxDistance;

        private int _leftBound;
        private int _rightBound;
        private int _upperBound;
        private int _lowerBound;

        private int _maxWidth;
        private int _maxHeight;

        private float _minAngle;
        private int _minConfidence;
        private int _maxConfidence;
        private float _inputDistance;

        private Size _monitorSize;
        private int _leftClipping, _rightClipping, _topClipping, _bottomClipping;

        public int MaxWidth
        {
            get => _maxWidth;
            set => SetProperty(ref _maxWidth, value);
        }

        public int MaxHeight
        {
            get => _maxHeight;
            set => SetProperty(ref _maxHeight, value);
        }

        public int LeftBound
        {
            get
            {
                if (_filterManager?.LimitationFilter != null)
                    _leftBound = _filterManager.LimitationFilter.LeftBound;

                return _leftBound;
            }
            set
            {
                if (_filterManager?.LimitationFilter != null)
                    _filterManager.LimitationFilter.LeftBound = value;

                SetProperty(ref _leftBound, value);
                RaisePropertyChanged(nameof(LeftToRightBound));
            }
        }

        public int RightBound
        {
            get
            {
                if (_filterManager?.LimitationFilter != null)
                    _rightBound = _filterManager.LimitationFilter.RightBound;

                return _rightBound;
            }
            set
            {
                if (_filterManager?.LimitationFilter != null)
                    _filterManager.LimitationFilter.RightBound = value;

                SetProperty(ref _rightBound, value);
                RaisePropertyChanged(nameof(LeftToRightBound));
            }
        }

        public string LeftToRightBound => LeftBound + " to " + RightBound;

        public int UpperBound
        {
            get
            {
                if (_filterManager?.LimitationFilter != null)
                    _upperBound = _filterManager.LimitationFilter.UpperBound;

                return _upperBound;
            }
            set
            {
                if (_filterManager?.LimitationFilter != null)
                    _filterManager.LimitationFilter.UpperBound = value;

                SetProperty(ref _upperBound, value);
                RaisePropertyChanged(nameof(UpperToLowerBound));
            }
        }

        public int LowerBound
        {
            get
            {
                if (_filterManager?.LimitationFilter != null)
                    _lowerBound = _filterManager.LimitationFilter.LowerBound;

                return _lowerBound;
            }
            set
            {
                if (_filterManager?.LimitationFilter != null)
                    _filterManager.LimitationFilter.LowerBound = value;

                SetProperty(ref _lowerBound, value);
                RaisePropertyChanged(nameof(UpperToLowerBound));
            }
        }

        public string UpperToLowerBound => UpperBound + " to " + LowerBound;

        public int MonitorWidth
        {
            get => (int)_monitorSize.Width;
            set
            {
                _monitorSize.Width = value;
                RaisePropertyChanged(nameof(MonitorWidth));
            }
        }

        public int MonitorHeight
        {
            get => (int)_monitorSize.Height;
            set
            {
                _monitorSize.Height = value;
                RaisePropertyChanged(nameof(MonitorHeight));
            }
        }

        public int LeftClipping
        {
            get => _leftClipping;
            set
            {
                SetProperty(ref _leftClipping, value);
                RaisePropertyChanged(nameof(LeftToRightClipping));
            }
        }

        public int RightClipping
        {
            get => _rightClipping;
            set
            {
                SetProperty(ref _rightClipping, value);
                RaisePropertyChanged(nameof(LeftToRightClipping));
            }
        }

        public string LeftToRightClipping => LeftClipping + " to " + RightClipping;

        public int TopClipping
        {
            get => _topClipping;
            set
            {
                SetProperty(ref _topClipping, value);
                RaisePropertyChanged(nameof(TopToBottomClipping));
            }
        }

        public int BottomClipping
        {
            get => _bottomClipping;
            set
            {
                SetProperty(ref _bottomClipping, value);
                RaisePropertyChanged(nameof(TopToBottomClipping));
            }
        }

        public string TopToBottomClipping => TopClipping + " to " + BottomClipping;

        public float Threshold
        {
            get
            {
                if (_filterManager?.ThresholdFilter != null)
                    _threshold = _filterManager.ThresholdFilter.Threshold;

                return _threshold;
            }
            set
            {
                if (_filterManager?.ThresholdFilter != null)
                    _filterManager.ThresholdFilter.Threshold = value;

                SetProperty(ref _threshold, value);
            }
        }

        public int BoxFilterRadius
        {
            get
            {
                if (_filterManager?.BoxFilter != null)
                    _boxFilterRadius = _filterManager.BoxFilter.Radius;

                return _boxFilterRadius;
            }
            set
            {
                if (_filterManager?.BoxFilter != null)
                    _filterManager.BoxFilter.Radius = value;

                SetProperty(ref _boxFilterRadius, value);
            }
        }

        public float Distance
        {
            get
            {
                if (_interactionManager != null)
                    _distance = _interactionManager.Distance;

                return _distance;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.Distance = value;

                SetProperty(ref _distance, value);
            }
        }

        public float MinDistance
        {
            get
            {
                if (_interactionManager != null)
                    _minDistance = _interactionManager.MinDistance;

                return _minDistance;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.MinDistance = value;

                SetProperty(ref _minDistance, value);
                RaisePropertyChanged(nameof(MinToMaxDistance));
            }
        }

        public float MaxDistance
        {
            get
            {
                if (_interactionManager != null)
                    _maxDistance = _interactionManager.MaxDistance;

                return _maxDistance;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.MaxDistance = value;

                SetProperty(ref _maxDistance, value);
                RaisePropertyChanged(nameof(MinToMaxDistance));
            }
        }

        public string MinToMaxDistance => MinDistance + " to " + MaxDistance;

        public float MinAngle
        {
            get
            {
                if (_interactionManager != null)
                    _minAngle = _interactionManager.MinAngle;

                return _minAngle;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.MinAngle = value;

                SetProperty(ref _minAngle, value);                
            }
        }

        public string MinToMaxConfidence => MinConfidence + " to " + MaxConfidence;

        public int MinConfidence
        {
            get
            {
                if (_interactionManager != null)
                    _minConfidence = _interactionManager.MinConfidence;

                return _minConfidence;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.MinConfidence = value;

                SetProperty(ref _minConfidence, value);
                RaisePropertyChanged(nameof(MinToMaxConfidence));
            }
        }

        public int MaxConfidence
        {
            get
            {
                if (_interactionManager != null)
                    _maxConfidence = _interactionManager.MaxConfidence;

                return _maxConfidence;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.MaxConfidence = value;

                SetProperty(ref _maxConfidence, value);
                RaisePropertyChanged(nameof(MinToMaxConfidence));
            }
        }

        public float InputDistance
        {
            get
            {
                if (_interactionManager != null)
                    _inputDistance = _interactionManager.InputDistance;

                return _inputDistance;
            }
            set
            {
                if (_interactionManager != null)
                    _interactionManager.InputDistance = value;

                SetProperty(ref _inputDistance, value);
            }
        }

        public ICommand LoadSettingsCommand { get; }
        public ICommand ResetSettingsCommand { get; }
        public ICommand SaveSettingsCommand { get; }

        public FilterViewModel(IEventAggregator eventAggregator, IFilterManager filterManager, IInteractionManager interactionManager)
        {
            _eventAggregator = eventAggregator;
            _filterManager = filterManager;
            _interactionManager = interactionManager;

            MonitorWidth = (int)SystemParameters.PrimaryScreenWidth;
            MonitorHeight = (int)SystemParameters.PrimaryScreenHeight;

            LoadSettingsCommand = new DelegateCommand(LoadSettings);
            SaveSettingsCommand = new DelegateCommand(SaveSettings);
            ResetSettingsCommand = new DelegateCommand(ResetSettings);

            _eventAggregator.GetEvent<NotifyCameraChosenEvent>().Subscribe(OnCameraChosen);

            Application.Current.Exit += OnClosing;

            LoadSettings();
        }

        private void OnCameraChosen(Tuple<int, int> payload)
        {
            MaxWidth = payload.Item1;
            MaxHeight = payload.Item2;

            if (RightBound > MaxWidth)
                RightBound = MaxWidth;

            if (LowerBound > MaxHeight)
                LowerBound = MaxHeight;
        }

        private void OnClosing(object sender, ExitEventArgs e) => SaveSettings();

        public void LoadSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            _eventAggregator.GetEvent<RequestLoadSettingsEvent>().Publish();

            Threshold = _settings.Threshold;
            BoxFilterRadius = _settings.BoxFilterRadius;
            Distance = _settings.Distance;
            MinDistance = _settings.MinDistance;
            MaxDistance = _settings.MaxDistance;
            LeftBound = _settings.LeftBorder;
            RightBound = _settings.RightBorder;
            UpperBound = _settings.UpperBorder;
            LowerBound = _settings.LowerBorder;
            LeftClipping = _settings.CalibrationStartX;
            TopClipping = _settings.CalibrationStartY;
            RightClipping = _settings.CalibrationSizeX;
            BottomClipping = _settings.CalibrationSizeY;
            MinAngle = _settings.MinAngle;
            MinConfidence = _settings.MinConfidence;
            MaxConfidence = _settings.MaxConfidence;
            InputDistance = _settings.InputDistance;
        }

        public void ResetSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            _settings.Reset();
            LoadSettings();
        }

        public void SaveSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            _eventAggregator.GetEvent<RequestSaveSettingsEvent>().Publish();

            _settings.Threshold = Threshold;
            _settings.BoxFilterRadius = BoxFilterRadius;
            _settings.Distance = Distance;
            _settings.MinDistance = MinDistance;
            _settings.MaxDistance = MaxDistance;
            _settings.LeftBorder = LeftBound;
            _settings.RightBorder = RightBound;
            _settings.UpperBorder = UpperBound;
            _settings.LowerBorder = LowerBound;
            _settings.CalibrationStartX = LeftClipping;
            _settings.CalibrationStartY = TopClipping;
            _settings.CalibrationSizeX = RightClipping - LeftClipping;
            _settings.CalibrationSizeY = BottomClipping - TopClipping;
            _settings.MinAngle = MinAngle;
            _settings.MinConfidence = MinConfidence;
            _settings.MaxConfidence = MaxConfidence;
            _settings.InputDistance = InputDistance;

            _settings.Save();
        }

        public void Dispose()
        {
            _eventAggregator.GetEvent<NotifyCameraChosenEvent>().Unsubscribe(OnCameraChosen);
        }
    }
}
