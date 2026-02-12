namespace ReFlex.Server.Data.Config
{
    public class CameraConfiguration
    {
        public int Width { get; set; }

        public int Height { get; set; }

        public int Framerate { get; set; }

        public string GetCameraDefinitionString()
        {
            var result = $"{Width} x {Height} x {Framerate}fps{Environment.NewLine}";
            return result;
        }
        
        public string GetCameraDescription()
        {
            var result = $"{Width} x {Height} x {Framerate}";
            return result;
        }
    }
}