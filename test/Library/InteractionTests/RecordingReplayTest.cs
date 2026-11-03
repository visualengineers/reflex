using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NUnit.Framework;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Util;
using ReFlex.Sensor.EmulatorModule;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace InteractionTests;

[NonParallelizable]
public class RecordingReplayTest
{
    private string _directory;
    private StreamParameter _configuration;

    [SetUp]
    public void SetUp()
    {
        var name = $"replay-test-{Guid.NewGuid():N}";
        _directory = Path.Combine(RecordingUtils.SavePath, name);
        Directory.CreateDirectory(_directory);
        _configuration = new StreamParameter(1, 1, 10, DepthImageFormat.Greyccale48bpp, name);
        File.WriteAllText(Path.Combine(_directory, RecordingUtils.ConfigFile), JsonConvert.SerializeObject(_configuration));
    }

    [TearDown]
    public void TearDown() => Directory.Delete(_directory, true);

    [Test]
    public void FramesAreSortedBySequenceNumberRatherThanFileSystemOrder()
    {
        foreach (var name in new[] { "0000010", "10000000", "0000002", "9999999", "0000000" })
            File.WriteAllText(Path.Combine(_directory, name + ".png"), "");
        File.WriteAllText(Path.Combine(_directory, "ignored.jpg"), "");

        Assert.That(RecordingUtils.GetFrames(_configuration.Name).Select(Path.GetFileNameWithoutExtension),
            Is.EqualTo(new[] { "0000000", "0000002", "0000010", "9999999", "10000000" }));
    }

    [Test]
    public void LegacyJpegRecordingsAreStillEnumeratedInOrder()
    {
        var configuration = new StreamParameter(1, 1, 10, DepthImageFormat.Rgb24bpp, _configuration.Name);
        File.WriteAllText(Path.Combine(_directory, RecordingUtils.ConfigFile), JsonConvert.SerializeObject(configuration));
        foreach (var index in new[] { 10, 2, 0 })
        {
            using var image = new Image<Rgb24>(1, 1);
            image.SaveAsJpeg(Path.Combine(_directory, $"{index:0000000}.jpg"));
        }

        Assert.That(RecordingUtils.GetFrames(configuration.Name).Select(Path.GetFileName),
            Is.EqualTo(new[] { "0000000.jpg", "0000002.jpg", "0000010.jpg" }));
    }

    [Test]
    public async Task ReplayEmitsFramesInOrderAndWaitsBetweenFrames()
    {
        foreach (var index in new[] { 2, 0, 1 })
        {
            using var image = new Image<Rgb48>(1, 1);
            image[0, 0] = new Rgb48((ushort)(index + 1), (ushort)(index + 1), (ushort)(index + 1));
            image.SaveAsPng(Path.Combine(_directory, $"{index:0000000}.png"));
        }

        var camera = new DepthStreamReplayCamera();
        camera.GetPossibleConfigurations();
        camera.EnableStream(_configuration);
        var values = new List<byte>();
        var times = new List<long>();
        var clock = Stopwatch.StartNew();
        var stopped = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        camera.DepthImageReady += (_, frame) =>
        {
            values.Add(frame.ImageData[0]);
            times.Add(clock.ElapsedMilliseconds);
            if (values.Count == 4) camera.StopStream();
        };
        camera.StateChanged += (_, state) =>
        {
            if (state == DepthCameraState.Connected) stopped.TrySetResult(true);
        };

        try
        {
            camera.StartStream();
            await stopped.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Assert.That(values, Is.EqualTo(new byte[] { 1, 2, 3, 1 }));
            Assert.That(times.Zip(times.Skip(1), (first, second) => second - first), Is.All.GreaterThanOrEqualTo(80));
        }
        finally
        {
            camera.StopStream();
            await stopped.Task.WaitAsync(TimeSpan.FromSeconds(5));
        }
    }
}
