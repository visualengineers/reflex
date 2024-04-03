using System;
using System.Windows;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class InteractionPointViewModel : BindableBase
    {
        private Point3 _position;
        private Point _displayPosition;
        private int _width, _height;
        private int _offsetX, _offsetY;

        public Point3 Position
        {
            get => _position;
            set
            {
                _position = new Point3(value.X * Width, value.Y * Height, value.Z);
                DisplayPosition = new Point(value.X * Width, value.Y * Height);
                RaisePropertyChanged(nameof(Position));
                RaisePropertyChanged(nameof(PositionString));
            }
        }

        public Point DisplayPosition
        {
            get => _displayPosition;
            set => SetProperty(ref _displayPosition, value);
        }

        public string PositionString => "X: " + System.Math.Round(Position.X / Width, 2) + " Y: " + System.Math.Round(Position.Y / Height, 2) + " Z: " + System.Math.Round(Position.Z, 2);

        public int Width
        {
            get => _width;
            set => SetProperty(ref _width, value);
        }

        public int Height
        {
            get => _height;
            set => SetProperty(ref _height, value);
        }

        public int OffsetX
        {
            get => _offsetX;
            set => SetProperty(ref _offsetX, value);
        }

        public int OffsetY
        {
            get => _offsetY;
            set => SetProperty(ref _offsetY, value);
        }

        public InteractionPointViewModel(Point3 position, int width, int height, int offsetX, int offsetY)
        {
            Width = width;
            Height = height;
            OffsetX = offsetX;
            OffsetY = offsetY;
            Position = position;
        }
    }
}
