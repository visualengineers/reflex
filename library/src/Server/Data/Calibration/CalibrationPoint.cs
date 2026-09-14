namespace ReFlex.Server.Data.Calibration
{
    public class CalibrationPoint
    {
        public int PositionX { get; set; }
        
        public int PositionY { get; set; }

        public int TouchId { get; set; }

        public CalibrationPoint()
        {
            
        }

        public CalibrationPoint(int[] values)
        {
            if (values.Length < 2) 
                return;
            PositionX = values[0];
            PositionY = values[1];            
            TouchId = values.Length == 2 ? -1 : values[2];
        }

        public int[] ToArray()
        {
            return new[] {PositionX, PositionY, TouchId};
        }
    }
}