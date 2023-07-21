using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using Implementation.Interfaces;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class InteractionVisualisationViewModel : BindableBase, IDisposable
    {
        private readonly Size _initWindowSize = new Size(1600, 900);
        private readonly IInteractionManager _interactionManager;
        private readonly IEventAggregator _eventAggregator;
        private readonly ICalibrationManager _calibrationManager;

        private WindowStyle _windowStyle;
        private WindowState _windowState;
        private bool _isTitleBarVisible;
        private bool _isControlPanelVisible;
        private Size _windowSize;
        private Size _canvasSize;
        private Point _offset;

        private readonly CancellationTokenSource _cancelUpdate = new CancellationTokenSource();

        public ObservableCollection<InteractionPointViewModel> Interactions { get; }

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

        public bool IsControlPanelVisible
        {
            get => _isControlPanelVisible;
            set => SetProperty(ref _isControlPanelVisible, value);
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

        public double CanvasWidth
        {
            get => _canvasSize.Width;
            set
            {
                _canvasSize.Width = value;
                RaisePropertyChanged(nameof(CanvasWidth));
            }
        }

        public double CanvasHeight
        {
            get => _canvasSize.Height;
            set
            {
                _canvasSize.Height = value;
                RaisePropertyChanged(nameof(CanvasHeight));
            }
        }

        public Point Offset
        {
            get => _offset;
            set => SetProperty(ref _offset, value);
        }

        public ICommand ToggleInteractionVisualisationViewCommand { get; }
        public ICommand TerminateApplicationCommand { get; }
        public ICommand ToggleFullscreenCommand { get; }

        public InteractionVisualisationViewModel(IEventAggregator eventAggregator, IInteractionManager interactionManager, ICalibrationManager calibrationManager)
        {
            _interactionManager = interactionManager;
            _interactionManager.InteractionsUpdated += OnInteractionsUpdated;
            _calibrationManager = calibrationManager;

            _eventAggregator = eventAggregator;
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfDebugViewEvent>().Subscribe(ToggleFullscreen);
            _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Subscribe(OnClosing);

            WindowState = WindowState.Normal;
            WindowStyle = WindowStyle.SingleBorderWindow;
            IsTitleBarVisible = true;
            WindowWidth = _initWindowSize.Width;
            WindowHeight = _initWindowSize.Height;
            CanvasWidth = Settings.Default.CalibrationSizeX;
            CanvasHeight = Settings.Default.CalibrationSizeY;
            Interactions = new ObservableCollection<InteractionPointViewModel>();

            ToggleInteractionVisualisationViewCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleInteractionVisualisationViewEvent>().Publish());
            TerminateApplicationCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Publish());
            ToggleFullscreenCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleFullscreenOfDebugViewEvent>().Publish());

            
        }

        private void OnClosing()
        {
            _cancelUpdate.Cancel();
            Dispose();
        }

        public void Dispose()
        {
            _interactionManager.InteractionsUpdated -= OnInteractionsUpdated;
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfDebugViewEvent>().Unsubscribe(ToggleFullscreen);
            _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Unsubscribe(OnClosing);
        }

        private void OnInteractionsUpdated(object sender, IList<Interaction> interactions)
        {
            IList<Interaction> copy;

            // lock (interactions)
            // {
                copy = interactions.ToList();
            // }

            Application.Current?.Dispatcher?.Invoke(() =>
            {
                Interactions.Clear();
                var width = Settings.Default.CalibrationSizeX;
                var height = Settings.Default.CalibrationSizeY;
                Offset = new Point(Settings.Default.CalibrationStartX, Settings.Default.CalibrationStartY);

                foreach (var interaction in copy)
                {
                    var calibrated = _calibrationManager.Calibrate(interaction);
                    Interactions.Add(new InteractionPointViewModel(calibrated.Position, width, height, (int) Offset.X,
                        (int) Offset.Y));
                }
            }, DispatcherPriority.Normal, _cancelUpdate.Token);
        }

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
    }
}
