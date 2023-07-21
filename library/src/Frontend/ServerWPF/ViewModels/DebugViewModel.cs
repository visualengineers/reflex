using System;
using System.Windows;
using System.Windows.Input;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Frontend.ServerWPF.Events;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class DebugViewModel : BindableBase, IDisposable
    {
        private readonly Size _initWindowSize = new Size(1600, 900);
        private readonly IEventAggregator _eventAggregator;

        private WindowStyle _windowStyle;
        private WindowState _windowState;
        private bool _isTitleBarVisible;
        private bool _isControlPanelVisible;
        private Size _windowSize;

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

        public ICommand ToggleDebugViewCommand { get; }
        public ICommand TerminateApplicationCommand { get; }
        public ICommand ToggleFullscreenCommand { get; }

        public DebugViewModel(IEventAggregator eventAggregator)
        {
            _eventAggregator = eventAggregator;
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfDebugViewEvent>().Subscribe(ToggleFullscreen);

            WindowState = WindowState.Normal;
            WindowStyle = WindowStyle.SingleBorderWindow;
            IsTitleBarVisible = true;
            WindowWidth = _initWindowSize.Width;
            WindowHeight = _initWindowSize.Height;

            ToggleDebugViewCommand = new DelegateCommand(() => 
                _eventAggregator?.GetEvent<RequestToggleDebugViewEvent>().Publish());
            TerminateApplicationCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Publish());
            ToggleFullscreenCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleFullscreenOfDebugViewEvent>().Publish());
        }

        public void Dispose()
        {
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfDebugViewEvent>().Unsubscribe(ToggleFullscreen);
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
