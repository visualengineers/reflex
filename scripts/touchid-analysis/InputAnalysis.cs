using Newtonsoft.Json;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using ReFlex.Sensor.EmulatorModule;

static class InputAnalysis
{
    public static void Run(string directory)
    {
        Directory.SetCurrentDirectory("tools/ReFlex.TrackingServer");
        foreach(var name in new[]{"Half-Circle","Line","Circle"})
        {
            var rows=new List<object>(); var frame=0;
            foreach(var path in RecordingUtils.GetFrames(name))
            {
                using var image=Image.Load<Rgb24>(path);
                double strongest=0; int px=0,py=0;
                for(var y=0;y<image.Height;y++) for(var x=0;x<image.Width;x++)
                {
                    if(name=="Half-Circle" && (x-249)*(x-249)+(y-210)*(y-210)<=60*60) continue;
                    var value=image[x,y].B;
                    var offset=value<127 ? (value/127.0-1)*.65 : (value-127)/128.0*.65;
                    if(System.Math.Abs(offset)>System.Math.Abs(strongest)) { strongest=offset; px=x;py=y; }
                }
                rows.Add(new {frame=frame++,x=px,y=py,offset=strongest,aboveThreshold=System.Math.Abs(strongest)>.05});
            }
            File.WriteAllText(Path.Combine(directory,name+"-input.json"),JsonConvert.SerializeObject(rows));
        }
    }
}
