using System;
using System.Windows.Media;
using Prism.Mvvm;

namespace ReFlex.Frontend.ServerWPF.Util
{
    public class VectorVisualizationProperties : BindableBase
    {
        private double _endPosX;
        private double _endPosY;

        private Color _color;

        public double StartPosX { get; }
        public double StartPosY { get; }

        public double EndPosX
        {
            get => _endPosX;
            private set
            {
                if (Math.Abs(value - _endPosX) < 1)
                    return;

                SetProperty(ref _endPosX, value);

            }
        }

        public double EndPosY
        {
            get => _endPosY;
            private set
            {
                if (Math.Abs(value - _endPosY) < 1)
                    return;

                SetProperty(ref _endPosY, value);

            }
        }

        public Color Color
        {
            get => _color;
            private set
            {
                if (Equals(value, _color))
                    return;
                SetProperty(ref _color, value);
            }
        }

        public VectorVisualizationProperties(double posX, double posY)
        {
            StartPosX = posX;
            StartPosY = posY;

            var dirX = GetRandomOffset();
            var dirY = GetRandomOffset();

            EndPosX = posX + dirX;
            EndPosY = posY + dirY;

            Color = ComputeColor(dirX, dirY);
        }

        public void Update(double dirX, double dirY)
        {
            EndPosX = StartPosX + dirX;
            EndPosY = StartPosY + dirY;

            var l = Math.Sqrt(dirX * dirX + dirY * dirY);
            if (l < Double.Epsilon)
                l = 0.1;

            Color = ComputeColor(dirX / l, dirY / l);
        }

        private double GetRandomOffset()
        {
            return (2.0 * new Random().NextDouble()) - 1.0;
        }

        private static Color ComputeColor(double dirX, double dirY)
        {
            var r = 128 + (128.0 * dirX);
            var g = 128 + (128.0 * dirY);
            var b = Math.Abs(128 * (dirX + dirY));

            return Color.FromRgb((byte)r, (byte)g, (byte)b);
        }
    }

}
