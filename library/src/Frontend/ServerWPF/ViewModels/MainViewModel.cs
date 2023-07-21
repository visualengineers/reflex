using System;
using System.Reflection;
using System.Windows;
using System.Windows.Input;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;
using ReFlex.Frontend.ServerWPF.Views;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class MainViewModel : BindableBase, IDisposable
    {
        private readonly Size _initWindowSize = new Size(500, 600);
        private readonly IEventAggregator _eventAggregator;

        private WindowStyle _windowStyle;
        private WindowState _windowState;
        private bool _isTitleBarVisible;
        private Size _windowSize;
        private DebugView _debugView;
        private CalibrationView _calibrationView;
        private InteractionVisualisationView _interactionVisualisationView;
        private bool _isAutoStartEnabled;
        private Settings _settings;

        public WindowStyle WindowStyle
        {
            get => _windowStyle;
            set => SetProperty(ref _windowStyle, value);
        }

        public WindowState WindowState
        {
            get => _windowState;
            set => SetProperty(ref _windowState, value);
        }

        public bool IsTitleBarVisible
        {
            get => _isTitleBarVisible;
            set => SetProperty(ref _isTitleBarVisible, value);
        }

        public double WindowWidth
        {
            get => _windowSize.Width;
            set
            {
                _windowSize.Width = value;
                RaisePropertyChanged(nameof(WindowWidth));
            }
        }

        public double WindowHeight
        {
            get => _windowSize.Height;
            set
            {
                _windowSize.Height = value;
                RaisePropertyChanged(nameof(WindowHeight));
            }
        }

        public bool IsDebugViewVisible
        {
            get => _debugView != null;
            set
            {
                if (value)
                {
                    _debugView = new DebugView();
                    _debugView.Closed += OnDebugViewClosed;
                    _debugView.Show();
                }
                else
                {
                    _debugView?.Close();
                }
                RaisePropertyChanged(nameof(IsDebugViewVisible));
            }
        }

        public bool IsCalibrationViewVisible
        {
            get => _calibrationView != null;
            set
            {
                if (value)
                {
                    _calibrationView = new CalibrationView();
                    _calibrationView.Closed += OnCalibrationViewClosed;
                    _calibrationView.Show();
                }
                else
                {
                    _calibrationView?.Close();
                }
                RaisePropertyChanged(nameof(IsCalibrationViewVisible));
            }
        }

        public bool IsInteractionVisualisationViewVisible
        {
            get => _interactionVisualisationView != null;
            set
            {
                if (value)
                {
                    _interactionVisualisationView = new InteractionVisualisationView();
                    _interactionVisualisationView.Closed += OnInteractionVisualisationViewClosed;
                    _interactionVisualisationView.Show();
                }
                else
                {
                    _interactionVisualisationView?.Close();
                }

                RaisePropertyChanged(nameof(IsInteractionVisualisationViewVisible));
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the automatic start of the stream is enabled.
        /// </summary>
        /// <value>
        ///   <c>true</c> if automatic start enabled; otherwise, <c>false</c>.
        /// </value>
        public bool IsAutoStartEnabled
        {
            get => _isAutoStartEnabled;
            set => SetProperty(ref _isAutoStartEnabled, value);
        }

        /// <summary>
        /// Gets the title.
        /// </summary>
        /// <value>
        /// The title.
        /// </value>
        public string Title => "DSense Server - v." + Version();

        /// <summary>
        /// Gets the running version.
        /// </summary>
        /// <returns></returns>
        public string Version() => Assembly.GetExecutingAssembly().GetName().Version.ToString();

        public ICommand TerminateApplicationCommand { get; }
        public ICommand ToggleFullscreenCommand { get; }
        public ICommand ToggleDebugViewCommand { get; }
        public ICommand ToggleCalibrationViewCommand { get; }
        public ICommand ToggleInteractionVisualisationViewCommand { get; }

        public MainViewModel(IEventAggregator eventAggregator)
        {
            _eventAggregator = eventAggregator;
            _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Subscribe(TerminateApplication);
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfMainViewEvent>().Subscribe(ToggleFullscreen);
            _eventAggregator?.GetEvent<RequestToggleDebugViewEvent>().Subscribe(ToggleDebugView);
            _eventAggregator?.GetEvent<RequestToggleCalibrationViewEvent>().Subscribe(ToggleCalibrationView);
            _eventAggregator?.GetEvent<RequestToggleInteractionVisualisationViewEvent>()
                .Subscribe(ToggleInteractionVisualisationView);
            _eventAggregator?.GetEvent<RequestSaveSettingsEvent>().Subscribe(SaveSettings);
            _eventAggregator?.GetEvent<RequestLoadSettingsEvent>().Subscribe(LoadSettings);

            WindowState = WindowState.Minimized;
            WindowStyle = WindowStyle.None;
            IsTitleBarVisible = true;
            WindowWidth = _initWindowSize.Width;
            WindowHeight = _initWindowSize.Height;

            TerminateApplicationCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Publish());
            ToggleFullscreenCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleFullscreenOfMainViewEvent>().Publish());
            ToggleDebugViewCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleDebugViewEvent>().Publish());
            ToggleCalibrationViewCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleCalibrationViewEvent>().Publish());
            ToggleInteractionVisualisationViewCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleInteractionVisualisationViewEvent>().Publish());
        }

        public void Dispose()
        {
            _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Unsubscribe(TerminateApplication);
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfMainViewEvent>().Unsubscribe(ToggleFullscreen);
            _eventAggregator?.GetEvent<RequestToggleDebugViewEvent>().Unsubscribe(ToggleDebugView);
            _eventAggregator?.GetEvent<RequestToggleCalibrationViewEvent>().Unsubscribe(ToggleCalibrationView);
            _eventAggregator?.GetEvent<RequestToggleInteractionVisualisationViewEvent>().Unsubscribe(ToggleInteractionVisualisationView);
            _eventAggregator?.GetEvent<RequestSaveSettingsEvent>().Unsubscribe(SaveSettings);
            _eventAggregator?.GetEvent<RequestLoadSettingsEvent>().Unsubscribe(LoadSettings);
        }

        private static void TerminateApplication() => Application.Current.Shutdown();

        private void ToggleFullscreen()
        {
            if (IsFullscreen)
            {
                WindowState = WindowState.Normal;
                WindowStyle = WindowStyle.SingleBorderWindow;
                IsTitleBarVisible = true;
                WindowWidth = _initWindowSize.Width;
                WindowHeight = _initWindowSize.Height;
            }
            else
            {
                WindowState = WindowState.Maximized;
                WindowStyle = WindowStyle.None;
                IsTitleBarVisible = false;
            }
        }

        private bool IsFullscreen => WindowState == WindowState.Maximized && WindowStyle == WindowStyle.None;

        private void ToggleDebugView() => IsDebugViewVisible = !IsDebugViewVisible;

        private void ToggleCalibrationView() => IsCalibrationViewVisible = !IsCalibrationViewVisible;

        private void ToggleInteractionVisualisationView() =>
            IsInteractionVisualisationViewVisible = !IsInteractionVisualisationViewVisible;

        private void OnDebugViewClosed(object sender, EventArgs e)
        {
            _debugView = null;
            RaisePropertyChanged(nameof(IsDebugViewVisible));
        }

        private void OnCalibrationViewClosed(object sender, EventArgs e)
        {
            _calibrationView = null;
            RaisePropertyChanged(nameof(IsCalibrationViewVisible));
        }

        private void OnInteractionVisualisationViewClosed(object sender, EventArgs e)
        {
            _interactionVisualisationView = null;
            RaisePropertyChanged(nameof(IsInteractionVisualisationViewVisible));
        }

        private void LoadSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            IsAutoStartEnabled = _settings.IsAutoStartEnabled;
        }

        private void SaveSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            _settings.IsAutoStartEnabled = IsAutoStartEnabled;
            _settings.Save();
        }
    }
}
