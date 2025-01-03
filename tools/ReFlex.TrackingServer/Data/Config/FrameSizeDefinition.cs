using ReFlex.Core.Calibration.Components;

namespace TrackingServer.Data.Config
{
    public class FrameSizeDefinition
    {
        public int Width { get; set; }

        public int Height { get; set; }

        public int Left { get; set; }

        public int Top { get; set; }

        public FrameSizeDefinition()
        {
            
        }

        public FrameSizeDefinition(int width, int height, int left, int top)
        {
            Width = width;
            Height = height;
            Left = left;
            Top = top;
        }

        public FrameSizeDefinition(Calibrator calibrator) 
            : this (calibrator.Width,calibrator.Height, calibrator.StartX, calibrator.StartY) {
        }

        public string GetFrameSizeDefinitionString()
        {
            var result =
                $"{nameof(FrameSizeDefinition)} [{nameof(Top)} | {nameof(Left)} | {nameof(Width)} | {nameof(Height)}]: {Top} | {Left} | {Width} | {Height}";
            result += $"{Environment.NewLine}";
            
            return result;
        } 
    }
}