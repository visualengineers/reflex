using Implementation.Components;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using NUnit.Framework;
using Prism.Events;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Server.Data.Calibration;
using ReFlex.Server.Data.Config;
using TrackingServer.Controllers;
using TrackingServer.Model;

namespace SettingsTests;

public class CalibrationApiTest
{
    private string _directory = null!;
    private PhysicalFileProvider _files = null!;
    private CalibrationManager _manager = null!;
    private CalibrationService _service = null!;
    private CalibrationController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _directory = Path.Combine(Path.GetTempPath(), "reflex-calibration-api-" + Guid.NewGuid());
        Directory.CreateDirectory(_directory);
        File.Copy(Path.Combine(TestContext.CurrentContext.TestDirectory, "TrackingSettings_default.json"),
            Path.Combine(_directory, "settings.json"));
        _files = new PhysicalFileProvider(_directory);
        var environment = new TestEnvironment { WebRootFileProvider = _files };
        var configuration = new ConfigurationManager(environment, new EventAggregator(),
            "settings.json", "defaults.json", "backup.json");
        var calibrator = new Calibrator(960, 600, 0, 0);
        configuration.Settings.FrameSize = new FrameSizeDefinition(960, 600, 0, 0);
        configuration.Settings.CalibrationValues = calibrator.CalibrationValues;
        _manager = new CalibrationManager();
        // Hub observables remain unsubscribed; the test exercises the REST controller directly.
        _service = new CalibrationService(_manager, calibrator, configuration, null!);
        _controller = new CalibrationController(_service);
    }

    [TearDown]
    public void TearDown()
    {
        _service.Dispose();
        _manager.Dispose();
        _files.Dispose();
        Directory.Delete(_directory, true);
    }

    [Test]
    public void ApplyImmediatelyUpdatesCalibratedPositionsWithoutSavingAreaOrSettings()
    {
        var settingsPath = Path.Combine(_directory, "settings.json");
        var savedSettings = File.ReadAllText(settingsPath);
        var raw = new Interaction(new Point3(150, 100, .5f), InteractionType.Push, 30);
        var original = _controller.GetCalibratedInteractions(new[] { raw }).Value!.Single();
        Assert.That(original.Position.X, Is.EqualTo(150f / 960).Within(1e-6));
        Assert.That(original.Position.Y, Is.EqualTo(100f / 600).Within(1e-6));

        foreach (var scale in new[] { 2, 4 })
        {
            var before = _controller.GetCalibratedInteractions(new[] { raw }).Value!.Single();
            var sourcePoints = _controller.GetSourceValues();
            for (var index = 0; index < sourcePoints.Length; index++)
            {
                var result = _controller.UpdateCalibrationPoint(index, new CalibrationPoint
                {
                    PositionX = sourcePoints[index].PositionX / scale,
                    PositionY = sourcePoints[index].PositionY / scale,
                    TouchId = index
                });
                Assert.That(result.Value, Is.Not.Null);
            }

            var preview = _controller.GetCalibrationMatrix().Value!;
            var uncommitted = _controller.GetCalibratedInteractions(new[] { raw }).Value!.Single();
            Assert.That(uncommitted.Position.X, Is.EqualTo(before.Position.X).Within(1e-6));
            Assert.That(uncommitted.Position.Y, Is.EqualTo(before.Position.Y).Within(1e-6));

            var applied = _controller.ApplyCalibration().Value!;
            var calibrated = _controller.GetCalibratedInteractions(new[] { raw }).Value!.Single();
            Assert.Multiple(() =>
            {
                Assert.That(applied.Transformation[0, 0], Is.EqualTo(scale).Within(1e-6));
                Assert.That(applied.Transformation, Is.EqualTo(preview.Transformation));
                Assert.That(calibrated.Position.X, Is.EqualTo(150f * scale / 960).Within(1e-6));
                Assert.That(calibrated.Position.Y, Is.EqualTo(100f * scale / 600).Within(1e-6));
                Assert.That(calibrated.Position.Z, Is.EqualTo(raw.Position.Z));
                Assert.That(raw.Position.X, Is.EqualTo(150));
                Assert.That(raw.Position.Y, Is.EqualTo(100));
                Assert.That(File.ReadAllText(settingsPath), Is.EqualTo(savedSettings));
                Assert.That(File.Exists(Path.Combine(_directory, "backup.json")), Is.False);
            });
        }
    }

    private sealed class TestEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "CalibrationApiTest";
        public string EnvironmentName { get; set; } = "Test";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = "";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }
}
