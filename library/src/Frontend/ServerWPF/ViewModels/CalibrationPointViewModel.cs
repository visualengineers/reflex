using System;
using System.Windows;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Frontend.ServerWPF.Events;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class CalibrationPointViewModel : BindableBase
    {
        private readonly int _idx;

        private int _windowWidth;
        private int _windowHeight;

        private bool _isVisible;
        private bool _isFinished;
        private bool _isSelected;

        private readonly IEventAggregator _evtAgg;

        public CalibrationPointViewModel(int idx, IEventAggregator eventAggregator)
        {
            _idx = idx;
            _evtAgg = eventAggregator;
        }

        public int Index => _idx;

        public Point Position { get; set; }

        public double TargetPositionX { get; private set; }

        public double TargetPositionY { get; private set; }

        public int WindowWidth
        {
            get => _windowWidth;
            set => SetProperty(ref _windowWidth, value);
        }

        public int WindowHeight
        {
            get => _windowHeight;
            set => SetProperty(ref _windowHeight, value);
        }

        public bool IsVisible
        {
            get => _isVisible;
            set => SetProperty(ref _isVisible, value);
        }

        public bool IsFinished
        {
            get => _isFinished;
            set => SetProperty(ref _isFinished, value);
        }

        public bool IsSelected
        {
            get => _isSelected;
            set
            {
                var hasChanged = SetProperty(ref _isSelected, value);
                if (hasChanged)
                    _evtAgg.GetEvent<CalibrationPointSelectionChangedEvent>().Publish(new Tuple<int, bool>(_idx, _isSelected));
            }
        }

        public void UpdatePosition(Point newPos)
        {
            TargetPositionX = newPos.X;
            TargetPositionY = newPos.Y;
            RaisePropertyChanged(nameof(TargetPositionX));
            RaisePropertyChanged(nameof(TargetPositionY));
            _evtAgg.GetEvent<CalibrationPointUpdatedEvent>().Publish(new Tuple<int, Point>(_idx, newPos));
        }

    }
}
