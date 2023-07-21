using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using CommonServiceLocator;
using Implementation.Interfaces;
using MathNet.Numerics.LinearAlgebra;
using Prism.Commands;
using Prism.Events;
using Prism.Ioc;
using Prism.Mvvm;
using Prism.Unity;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Common.Components;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;
using Unity;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    //@todo: calibrationManager, remove hardcoded values

    public class CalibrationViewModel : BindableBase, IDisposable
    {
        private readonly Size _initWindowSize = new Size(1600, 900);
        private readonly IEventAggregator _eventAggregator;
        private readonly ICalibrationManager _calibrationManager;
        private readonly IDepthImageManager _depthImageManager;
        private readonly Calibrator _calibrator;

        private WindowStyle _windowStyle;
        private WindowState _windowState;
        private bool _isTitleBarVisible;
        private bool _isControlPanelVisible;
        private Size _windowSize;

        private List<CalibrationPointViewModel> _calibrationPoints;
        private Matrix _calibrationMatrix;
        private Matrix<float> _calibrationResult;
        private int _state;
        private int _calibrationStartX, _calibrationStartY;
        private bool _isCalibrationFinished;
        private Thickness _canvasMargin;

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

                if (CalibrationPoints == null)
                    return;

                foreach (var calibrationPoint in CalibrationPoints)
                    calibrationPoint.WindowWidth = (int)value;
            }
        }

        public double WindowHeight
        {
            get => _windowSize.Height;
            set
            {
                _windowSize.Height = value;
                RaisePropertyChanged(nameof(WindowHeight));

                if (CalibrationPoints == null)
                    return;

                foreach (var calibrationPoint in CalibrationPoints)
                    calibrationPoint.WindowHeight = (int)value;
            }
        }

        public int CanvasWidth => _calibrator.Width;

        public int CanvasHeight => _calibrator.Height;

        public List<CalibrationPointViewModel> CalibrationPoints
        {
            get => _calibrationPoints;
            set => SetProperty(ref _calibrationPoints, value);
        }

        public ObservableCollection<Tuple<Point, Point>> CalibrationTargetPoints { get; }

        public Matrix CalibrationMatrix
        {
            get => _calibrationMatrix;
            set => SetProperty(ref _calibrationMatrix, value);
        }

        public VectorfieldViewModel VectorfieldViewModel { get; }

        public int CalibrationStartX
        {
            get => _calibrationStartX;
            set => SetProperty(ref _calibrationStartX, value);
        }

        public int CalibrationStartY
        {
            get => _calibrationStartY;
            set => SetProperty(ref _calibrationStartY, value);
        }

        public bool IsCalibrationFinished
        {
            get => _isCalibrationFinished;
            set => SetProperty(ref _isCalibrationFinished, value);
        }

        public Thickness CanvasMargin
        {
            get => _canvasMargin;
            set => SetProperty(ref _canvasMargin, value);
        }

        public ICommand TerminateApplicationCommand { get; }
        public ICommand ToggleCalibrationViewCommand { get; }
        public ICommand ToggleFullscreenCommand { get; }
        public ICommand StartCalibrationCommand { get; }
        public ICommand FinishCalibrationCommand { get; }

        public CalibrationViewModel(IEventAggregator eventAggregator, ICalibrationManager calibrationManager, IDepthImageManager depthImageManager)
        {
            _eventAggregator = eventAggregator;
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfCalibrationViewEvent>().Subscribe(ToggleFullscreen);
            _eventAggregator?.GetEvent<RequestStartCalibrationEvent>().Subscribe(StartCalibration);
            _calibrationManager = calibrationManager;
            _calibrator = ContainerLocator.Container.Resolve<Calibrator>("Calibrator");
            CanvasMargin = new Thickness(CalibrationStartX, CalibrationStartY, 0, 0);

            WindowState = WindowState.Normal;
            WindowStyle = WindowStyle.SingleBorderWindow;
            IsTitleBarVisible = true;
            WindowWidth = _initWindowSize.Width;
            WindowHeight = _initWindowSize.Height;

            VectorfieldViewModel = new VectorfieldViewModel();
            _depthImageManager = depthImageManager;
            _depthImageManager.VectorfieldChanged += OnVectorfieldChanged;

            _state = 0;
            CalibrationTargetPoints = new ObservableCollection<Tuple<Point, Point>>();

            var source = _calibrator.CalibrationValues.SourceValues;
            CalibrationPoints = new List<CalibrationPointViewModel>();

            for (var i = 0; i < source.Count; i++)
            {
                var calibrationPointVm = new CalibrationPointViewModel(i, eventAggregator)
                {
                    Position = new Point(source[i][0], source[i][1]),
                    IsVisible = false,
                    IsFinished = false
                };

                CalibrationPoints.Add(calibrationPointVm);
            }

            _calibrator.CalibrationUpdated += OnCalibrationUpdated;
            _calibrator.CalibrationFinished += OnCalibrationFinished;
            _calibrator.CalibrationLoaded += OnCalibrationLoaded;

            StartCalibrationCommand = new DelegateCommand(StartCalibration);
            RaisePropertyChanged(nameof(CalibrationPoints));

            ToggleCalibrationViewCommand = new DelegateCommand(() => 
                _eventAggregator?.GetEvent<RequestToggleCalibrationViewEvent>().Publish());
            TerminateApplicationCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestTerminateApplicationEvent>().Publish());
            ToggleFullscreenCommand = new DelegateCommand(() =>
                _eventAggregator?.GetEvent<RequestToggleFullscreenOfCalibrationViewEvent>().Publish());
            FinishCalibrationCommand = new DelegateCommand(FinishCalibration);

            LoadCalibration();

            _eventAggregator.GetEvent<CalibrationPointSelectionChangedEvent>()
                .Subscribe(OnCalibrationPointSelectionChanged);
            _eventAggregator.GetEvent<CalibrationPointUpdatedEvent>()
                .Subscribe(OnCalibrationPointUpdated);

            ToggleFullscreen();
        }

        private void OnCalibrationPointUpdated(Tuple<int, Point> updatedPosition)
        {
            _calibrator.UpdateTargetValue(updatedPosition.Item1, (int)updatedPosition.Item2.X, (int)updatedPosition.Item2.Y, _state);
        }

        private void OnCalibrationPointSelectionChanged(Tuple<int, bool> newSelectionState)
        {
            if (newSelectionState.Item2)
            {
                _calibrationPoints.Where(pt => !Equals(pt.Index, newSelectionState.Item1)).ToList()
                    .ForEach(pt => pt.IsSelected = false);
            }
        }

        private void OnVectorfieldChanged(object sender, VectorField2 vectors) =>
            Application.Current?.Dispatcher?.Invoke(() => VectorfieldViewModel?.UpdateVectorField(vectors));

        public void Dispose()
        {
            _eventAggregator?.GetEvent<RequestToggleFullscreenOfCalibrationViewEvent>().Unsubscribe(ToggleFullscreen);
        }

        public void StartCalibration()
        {
            ResetCalibration();

            _state = _calibrator.CalibrationStage;

            CalibrationPoints.ForEach(pt =>
            {
                pt.IsVisible = false;
                pt.IsFinished = false;
            });

            CalibrationPoints[_state].IsVisible = true;
        }

        public void SetPositionAndAdvanceToNextPoint(Point position)
        {
            if (_state > 2)
                return;
            CalibrationTargetPoints.Add(Tuple.Create(CalibrationPoints[_state].Position, position));
            CalibrationPoints[_state].IsFinished = true;
            CalibrationPoints[_state].UpdatePosition(position);
            _calibrator.AddTargetValue((int)position.X, (int)position.Y, _state);
            _state = _calibrator.CalibrationStage;

            if (_state < CalibrationPoints.Count)
                CalibrationPoints[_state].IsVisible = true;
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

        private void OnCalibrationUpdated(object sender, Matrix<float> calibrationMatrix)
        {
            _calibrationResult = calibrationMatrix;
            FinishCalibration();
        }

        private void OnCalibrationFinished(object sender, Matrix<float> calibrationMatrix)
        {
            _calibrationResult = calibrationMatrix;
            IsCalibrationFinished = true;
        }

        private void OnCalibrationLoaded(object sender, Matrix<float> calibrationMatrix)
        {
            _calibrationResult = calibrationMatrix;
            FinishCalibration();
        }

        private void FinishCalibration()
        {
            if (_calibrationResult == null)
                return;

            var transMat = _calibrationResult.Transpose();
            CalibrationMatrix = new Matrix(
                transMat.At(0, 0), transMat.At(0, 1),
                transMat.At(1, 0), transMat.At(1, 1),
                transMat.At(2, 0), transMat.At(2, 1));

            _calibrationManager.CalibrationMatrix = _calibrationResult;
            SaveCalibration();
            RaisePropertyChanged(nameof(CalibrationMatrix));
        }

        private void LoadCalibration()
        {
            CalibrationStartX = Settings.Default.CalibrationStartX;
            CalibrationStartY = Settings.Default.CalibrationStartY;
            var calib = Settings.Default.Calibration;
            if (string.IsNullOrWhiteSpace(calib))
                return;
            _calibrator.Load(calib);
        }

        private void SaveCalibration()
        {
            var calibString = _calibrator.Save("DSense.Server.Calibration.xml");
            Settings.Default.Calibration = calibString;
        }

        private void ResetCalibration()
        {
            IsCalibrationFinished = false;
            _calibrationManager?.ResetCalibration();
            _calibrator?.Reset();
            CalibrationTargetPoints?.Clear();
        }

    }
}
