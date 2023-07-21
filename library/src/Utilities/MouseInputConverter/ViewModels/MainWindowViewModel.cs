using System;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Input;
using ReFlex.Utilities.MouseInputConverter.Properties;
using Prism.Commands;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Components;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;
using Application = System.Windows.Application;

namespace ReFlex.Utilities.MouseInputConverter.ViewModels
{
    public class MainWindowViewModel : BindableBase
    {
        private readonly Size _initWindowSize = new Size(500, 220);
        private Size _windowSize;
        private bool _isMouseDown;

        [DllImport("User32.dll")]
        private static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
        public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, UIntPtr dwExtraInfo);

        private const uint MouseeventfLeftdown = 0x02;
        private const uint MouseeventfLeftup = 0x04;
        //private const uint MouseeventfRightdown = 0x08;
        //private const uint MouseeventfRightup = 0x10;

        private string _ipAddress = "127.0.0.1";
        private int _port = 8080;

        private Size _monitorSize;
        private Point _cursorPosition;

        private float _minDistance, _clickDistance;
        private bool _isMouseInputEnabled;

        public ICommand SaveSettingsCommand { get; }
        public ICommand LoadSettingsCommand { get; }
        public ICommand TerminateApplicationCommand { get; }

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

        public float MinDistance
        {
            get => _minDistance;
            set
            {
                SetProperty(ref _minDistance, value);
                RaisePropertyChanged(nameof(MinToClickDistance));
            }
        }

        public float ClickDistance
        {
            get => _clickDistance;
            set
            {
                SetProperty(ref _clickDistance, value);
                RaisePropertyChanged(nameof(MinToClickDistance));
            }
        }

        public string MinToClickDistance => MinDistance + " to " + ClickDistance;

        public bool IsMouseInputEnabled
        {
            get => _isMouseInputEnabled;
            set => SetProperty(ref _isMouseInputEnabled, value);
        }

        /// <summary>
        /// Gets the title.
        /// </summary>
        /// <value>
        /// The title.
        /// </value>
        public string Title => "DSense MouseInput-Converter - v." + Version();

        /// <summary>
        /// Gets the running version.
        /// </summary>
        /// <returns></returns>
        public string Version() => Assembly.GetExecutingAssembly().GetName().Version.ToString();

        public MainWindowViewModel()
        {
            WindowWidth = _initWindowSize.Width;
            WindowHeight = _initWindowSize.Height;
            MonitorWidth = (int) SystemParameters.PrimaryScreenWidth;
            MonitorHeight = (int)SystemParameters.PrimaryScreenHeight;

            TerminateApplicationCommand = new DelegateCommand(TerminateApplication);
            SaveSettingsCommand = new DelegateCommand(SaveSettings);
            LoadSettingsCommand = new DelegateCommand(LoadSettings);

            _cursorPosition = new Point(0, 0);
            _isMouseDown = false;

            IClient client = new NetworkClient(_ipAddress, _port);
            client.Connect();
            client.NewDataReceived += DataReceived;

            LoadSettings();
        }

        private void LoadSettings()
        {
            IsMouseInputEnabled = Settings.Default.IsMouseInputEnabled;
            MinDistance = Settings.Default.MinDistance;
            ClickDistance = Settings.Default.ClickDistance;
        }

        private void SaveSettings()
        {
            Settings.Default.IsMouseInputEnabled = IsMouseInputEnabled;
            Settings.Default.MinDistance = MinDistance;
            Settings.Default.ClickDistance = ClickDistance;
            Settings.Default.Save();
        }

        private void SendMouseDown()
            => mouse_event(MouseeventfLeftdown, 0, 0, 0, new UIntPtr(0));

        private void SendMouseUp()
            => mouse_event(MouseeventfLeftup, 0, 0, 0, new UIntPtr(0));

        private void DataReceived(object sender, NetworkingDataMessage message)
        {
            if (string.IsNullOrWhiteSpace(message?.Message))
                return;

            if (!_isMouseInputEnabled)
                return;

            var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(message.Message);
            var interaction = interactions.Count > 0 ? interactions[0] : new Interaction();
            interaction.Position.Z = -interaction.Position.Z;

            if (interaction.Position.X.Equals(0) || interaction.Position.Y.Equals(0))
                return;

            if (interaction.Position.Z > MinDistance)
            {
                _cursorPosition = new Point(interaction.Position.X * MonitorWidth, interaction.Position.Y * MonitorHeight);

                SetCursorPos(
                    (int)(_cursorPosition.X),
                    (int)(_cursorPosition.Y)
                );
            }

            if (interaction.Position.Z > ClickDistance && !_isMouseDown)
            {
                _isMouseDown = true;
                SendMouseDown();
            }
            else if(interaction.Position.Z <= ClickDistance &&  _isMouseDown)
            {
                _isMouseDown = false;
                SendMouseUp();
            }
        }

        private void TerminateApplication() => Application.Current.Shutdown();

    }
}
