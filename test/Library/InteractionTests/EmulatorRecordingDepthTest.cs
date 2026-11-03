using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Networking.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using ReFlex.Sensor.EmulatorModule;

namespace InteractionTests;

[NonParallelizable]
public class EmulatorRecordingDepthTest
{
    [TestCase(DepthImageFormat.Rgb24bpp, -0.25f)]
    [TestCase(DepthImageFormat.Rgb24bpp, 0.25f)]
    [TestCase(DepthImageFormat.Rgb24bpp, -1f)]
    [TestCase(DepthImageFormat.Rgb24bpp, 1f)]
    [TestCase(DepthImageFormat.Greyscale8bpp, -0.25f)]
    [TestCase(DepthImageFormat.Greyscale8bpp, 0.25f)]
    [TestCase(DepthImageFormat.Greyccale48bpp, -0.25f)]
    [TestCase(DepthImageFormat.Greyccale48bpp, 0.25f)]
    [TestCase(DepthImageFormat.Greyccale48bpp, -1f)]
    [TestCase(DepthImageFormat.Greyccale48bpp, 1f)]
    public async Task RecordedEmulatorDepthMatchesLiveDepth(DepthImageFormat format, float deformation)
    {
        var configuration = new StreamParameter(64, 48, 30, format, $"depth-test-{Guid.NewGuid():N}");
        var cloud = new EmulatedPointCloud(new EmulatorParameters
        {
            WidthInMeters = 2.4f, HeightInMeters = 1.6f,
            MinDepthInMeter = 0.8f, MaxDepthInMeter = 2.1f,
            PlaneDistanceInMeter = 1.45f, Radius = (int)(configuration.Width * 0.4)
        });
        cloud.InitializePointCloud(configuration);
        cloud.UpdateFromInteractions(new List<Interaction>
        {
            new Interaction { Position = new Point3(32, 24, deformation) }
        });
        var originalDepths = cloud.Points.Select(point => point.Z).ToArray();
        var originalImage = cloud.GetUpdatedDepthImage();
        Assert.That(originalImage.Format, Is.EqualTo(format));

        var source = new ImageSourceCamera(configuration);
        var recorder = new DepthStreamRecorder();
        var directory = recorder.StartRecording(source, configuration.Name, usePng: true);
        var replay = new DepthStreamReplayCamera();
        var stopped = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        byte[] replayPixels = null;
        float[] replayDepths = null;
        replay.DepthImageReady += (_, image) => replayPixels = (byte[])image.ImageData.Clone();
        replay.FrameReady += (_, frame) =>
        {
            replayDepths = frame.Depth.Select(point => point.Z).ToArray();
            replay.StopStream();
        };
        replay.StateChanged += (_, state) =>
        {
            if (state == DepthCameraState.Connected) stopped.TrySetResult(true);
        };

        try
        {
            source.Emit(originalImage);
            await recorder.StopRecording();
            var files = RecordingUtils.GetFrames(configuration.Name);
            Assert.That(files, Has.Length.EqualTo(1));
            Assert.That(Path.GetExtension(files[0]), Is.EqualTo(".png"));

            replay.GetPossibleConfigurations();
            replay.EnableStream(configuration);
            replay.StartStream();
            await stopped.Task.WaitAsync(TimeSpan.FromSeconds(5));

            Assert.That(replayPixels, Is.EqualTo(originalImage.ImageData), "Recording must preserve every sample byte.");
            // Round to the closest representable sample: at most half a depth step.
            var tolerance = format == DepthImageFormat.Greyccale48bpp ? 0.000011f : 0.0026f;
            Assert.That(replayDepths, Is.EqualTo(originalDepths).Within(tolerance),
                "Replay must preserve deformation strength and shape, including the extremum.");
        }
        finally
        {
            if (recorder.IsRecording) await recorder.StopRecording();
            if (replay.State == DepthCameraState.Streaming)
            {
                replay.StopStream();
                await stopped.Task.WaitAsync(TimeSpan.FromSeconds(5));
            }
            Directory.Delete(directory, true);
        }
    }

    [TestCase(DepthImageFormat.Rgb24bpp)]
    [TestCase(DepthImageFormat.Greyscale8bpp)]
    [TestCase(DepthImageFormat.Greyccale48bpp)]
    public async Task RecordingDefaultsToJpeg(DepthImageFormat format)
    {
        var configuration = new StreamParameter(2, 2, 30, format, $"jpg-test-{Guid.NewGuid():N}");
        var source = new ImageSourceCamera(configuration);
        var recorder = new DepthStreamRecorder();
        var directory = recorder.StartRecording(source, configuration.Name);
        try
        {
            var bytes = DepthImageFormatTools.BytesPerChannel(format);
            var channels = DepthImageFormatTools.NumChannels(format);
            source.Emit(new ImageByteArray(new byte[4 * bytes * channels], 2, 2, bytes, channels, format));
            await recorder.StopRecording();
            var frames = RecordingUtils.GetFrames(configuration.Name);
            Assert.That(frames, Has.Length.EqualTo(1));
            Assert.That(Path.GetExtension(frames[0]), Is.EqualTo(".jpg"));
            using var image = SixLabors.ImageSharp.Image.Load(frames[0]);
            Assert.That(image.Width, Is.EqualTo(2));
            Assert.That(image.Height, Is.EqualTo(2));
        }
        finally
        {
            if (recorder.IsRecording) await recorder.StopRecording();
            Directory.Delete(directory, true);
        }
    }

    private sealed class ImageSourceCamera : IDepthCamera
    {
        public ImageSourceCamera(StreamParameter configuration) => StreamParameter = configuration;
        public string Id => "TestImageSource";
        public string ModelDescription => Id;
        public CameraType CameraType => CameraType.Emulator;
        public DepthCameraState State => DepthCameraState.Streaming;
        public StreamParameter StreamParameter { get; }
        public event EventHandler<ImageByteArray> DepthImageReady;
        public event EventHandler<DepthCameraState> StateChanged { add { } remove { } }
        public event EventHandler<DepthCameraFrame> FrameReady { add { } remove { } }
        public void Emit(ImageByteArray image) => DepthImageReady?.Invoke(this, image);
        public void Initialize() { }
        public void EnableStream(StreamParameter parameter) { }
        public IList<StreamParameter> GetPossibleConfigurations() => new[] { StreamParameter };
        public void StartStream() { }
        public void StopStream() { }
    }
}
