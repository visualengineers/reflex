using System.Reflection;
using Implementation.Components;
using Implementation.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using Prism.Events;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Server.Data.Config;
using TrackingServer.Controllers;
using TrackingServer.Model;

namespace SettingsTests;

public class AssignmentApiTest
{
    private string _directory = null!;
    private PhysicalFileProvider _files = null!;
    private IWebHostEnvironment _environment = null!;
    private EventAggregator _events = null!;
    private ConfigurationManager _configuration = null!;
    private InteractionManager _manager = null!;
    private SettingsService _service = null!;
    private SettingsController _controller = null!;
    private IFilterManager _filter = null!;
    private IPerformanceAggregator _performance = null!;

    [SetUp]
    public void SetUp()
    {
        _directory = Path.Combine(Path.GetTempPath(), "reflex-assignment-api-" + Guid.NewGuid());
        Directory.CreateDirectory(_directory);
        var legacy = JObject.Parse(File.ReadAllText(Path.Combine(TestContext.CurrentContext.TestDirectory,
            "TrackingSettings_default.json")));
        foreach (var key in new[] { "UseKalmanFilter", "UseMinimumCostAssignment", "AssignmentMissCost", "AssignmentBirthCost" })
            legacy.Remove(key);
        legacy["FilterSettingValues"]!["FilterMask"] = null;
        File.WriteAllText(Path.Combine(_directory, "settings.json"), legacy.ToString());
        File.WriteAllText(Path.Combine(_directory, "defaults.json"), legacy.ToString());
        _files = new PhysicalFileProvider(_directory);
        _environment = Stub<IWebHostEnvironment>();
        _environment.WebRootFileProvider = _files;
        _events = new EventAggregator();
        _configuration = Configuration();
        var depth = Stub<IDepthImageManager>();
        ((PropertyStub)(object)depth).Values["PointCloud"] = new PointCloud3(30, 30);
        ((PropertyStub)(object)depth).Values["VectorField"] = new VectorField2(30, 30);
        _performance = Stub<IPerformanceAggregator>();
        _manager = new InteractionManager(depth, null!, _performance) { Type = ObserverType.MultiTouch };
        _filter = Stub<IFilterManager>();
        _service = new SettingsService(_configuration, _filter, _manager, _performance, _events);
        _service.Init();
        _controller = new SettingsController(_configuration, _filter, _manager, depth, _performance, _events);
    }

    [TearDown]
    public void TearDown()
    {
        _manager.Dispose();
        _files.Dispose();
        Directory.Delete(_directory, true);
    }

    private ConfigurationManager Configuration() => new(_environment, _events,
        "settings.json", "defaults.json", "backup.json");

    [Test]
    public void KalmanTogglePersistsReloadsAndRestoresDefaults()
    {
        Assert.That(_controller.GetUseKalmanFilter().Value, Is.False, "Legacy settings are opt-in.");
        _controller.SetUseKalmanFilter(true);
        Assert.That(_manager.UseKalmanFilter, Is.True);
        Assert.That(Configuration().Settings.UseKalmanFilter, Is.True);
        _manager.Type = ObserverType.SingleTouch;
        Assert.That(_manager.UseKalmanFilter, Is.True);
        var reloaded = Configuration();
        _manager.UseKalmanFilter = false;
        var startup = new SettingsService(reloaded, _filter, _manager, _performance, new EventAggregator());
        startup.Init();
        Assert.That(_manager.UseKalmanFilter, Is.True);
        _controller.SetUseKalmanFilter(false);
        Assert.That(Configuration().Settings.UseKalmanFilter, Is.False);
        _controller.Restore();
        Assert.That(_manager.UseKalmanFilter, Is.True);
        _controller.Reset();
        Assert.That(_manager.UseKalmanFilter, Is.False);
    }

    [Test]
    public void IndividualEndpointsApplyPersistAndReloadExplicitFalseAndZero()
    {
        Assert.That(_controller.GetUseMinimumCostAssignment().Value, Is.True);
        Assert.That(_controller.GetAssignmentMissCost().Value, Is.EqualTo(.5f));
        Assert.That(_controller.GetAssignmentBirthCost().Value, Is.EqualTo(.5f));
        Assert.That(_controller.SetUseMinimumCostAssignment(false).Value, Is.False);
        Assert.That(_controller.SetAssignmentMissCost(0).Value, Is.Zero);
        Assert.That(_controller.SetAssignmentBirthCost(1.25f).Value, Is.EqualTo(1.25f));
        var reloaded = Configuration();
        Assert.Multiple(() =>
        {
            Assert.That(_manager.UseMinimumCostAssignment, Is.False);
            Assert.That(_manager.AssignmentMissCost, Is.Zero);
            Assert.That(_manager.AssignmentBirthCost, Is.EqualTo(1.25f));
            Assert.That(reloaded.Settings.UseMinimumCostAssignment, Is.False);
            Assert.That(reloaded.Settings.AssignmentMissCost, Is.Zero);
            Assert.That(reloaded.Settings.AssignmentBirthCost, Is.EqualTo(1.25f));
        });
        // Simulate applying the persisted configuration during a later startup.
        _manager.UseMinimumCostAssignment = true;
        _manager.AssignmentMissCost = .5f;
        _manager.AssignmentBirthCost = .5f;
        var startup = new SettingsService(reloaded, _filter, _manager, _performance, new EventAggregator());
        startup.Init();
        Assert.Multiple(() =>
        {
            Assert.That(_manager.UseMinimumCostAssignment, Is.False);
            Assert.That(_manager.AssignmentMissCost, Is.Zero);
            Assert.That(_manager.AssignmentBirthCost, Is.EqualTo(1.25f));
        });
    }

    [Test]
    public void RestoreAndResetApplyTheSavedStrategyAndCosts()
    {
        _controller.SetUseMinimumCostAssignment(false);
        _controller.SetAssignmentMissCost(0);
        _controller.SetAssignmentBirthCost(1.25f);
        _controller.Restore(); // Backup is the configuration before the last cost change.
        Assert.Multiple(() =>
        {
            Assert.That(_manager.UseMinimumCostAssignment, Is.False);
            Assert.That(_manager.AssignmentMissCost, Is.Zero);
            Assert.That(_manager.AssignmentBirthCost, Is.EqualTo(.5f));
        });
        _controller.Reset();
        Assert.Multiple(() =>
        {
            Assert.That(_manager.UseMinimumCostAssignment, Is.True);
            Assert.That(_manager.AssignmentMissCost, Is.EqualTo(.5f));
            Assert.That(_manager.AssignmentBirthCost, Is.EqualTo(.5f));
        });
    }

    [TestCase(-1f)]
    [TestCase(float.NaN)]
    [TestCase(float.PositiveInfinity)]
    [TestCase(float.NegativeInfinity)]
    public void InvalidCostsReturnBadRequestWithoutMutatingMemoryOrDisk(float value)
    {
        var original = File.ReadAllText(Path.Combine(_directory, "settings.json"));
        Assert.Multiple(() =>
        {
            Assert.That(_controller.SetAssignmentMissCost(value).Result, Is.TypeOf<BadRequestObjectResult>());
            Assert.That(_controller.SetAssignmentBirthCost(value).Result, Is.TypeOf<BadRequestObjectResult>());
            Assert.That(_configuration.Settings.AssignmentMissCost, Is.EqualTo(.5f));
            Assert.That(_configuration.Settings.AssignmentBirthCost, Is.EqualTo(.5f));
            Assert.That(_manager.AssignmentMissCost, Is.EqualTo(.5f));
            Assert.That(_manager.AssignmentBirthCost, Is.EqualTo(.5f));
            Assert.That(File.ReadAllText(Path.Combine(_directory, "settings.json")), Is.EqualTo(original));
        });
    }

    [Test]
    public void FullSettingsSaveAndImportApplyAssignmentValues()
    {
        var value = Configuration().Settings;
        value.UseKalmanFilter = true;
        value.UseMinimumCostAssignment = false;
        value.AssignmentMissCost = .25f;
        value.AssignmentBirthCost = 0;
        _controller.Post(value);
        Assert.That(Configuration().Settings.AssignmentBirthCost, Is.Zero);
        Assert.That(_manager.UseMinimumCostAssignment, Is.False);
        Assert.That(Configuration().Settings.UseKalmanFilter, Is.True);
        value.UseKalmanFilter = false;
        value.UseMinimumCostAssignment = true;
        value.AssignmentMissCost = 0;
        _controller.LoadSettings(value);
        Assert.That(_manager.UseKalmanFilter, Is.False);
        Assert.That(_manager.UseMinimumCostAssignment, Is.True);
        Assert.That(_manager.AssignmentMissCost, Is.Zero);
    }

    [Test]
    public void PredictionSavePreservesBackupAndRestoreAppliesPreviousValues()
    {
        var original = _manager.PredictionHorizonSeconds;
        _controller.SetPrediction(new PredictionSettings
        {
            PredictionHorizonSeconds = .25, UseVelocityPrediction = false,
            NumFramesForPrediction = 4, UseSecondDerivation = true, SecondDerivationMagnitude = .75f
        });
        Assert.That(_manager.PredictionHorizonSeconds, Is.EqualTo(.25));
        Assert.That(Configuration().Settings.PredictionSettings.PredictionHorizonSeconds, Is.EqualTo(.25));
        var backup = JObject.Parse(File.ReadAllText(Path.Combine(_directory, "backup.json")));
        Assert.That((double)backup["PredictionSettings"]!["PredictionHorizonSeconds"]!, Is.EqualTo(original));
        _controller.Restore();
        Assert.Multiple(() =>
        {
            Assert.That(_manager.PredictionHorizonSeconds, Is.EqualTo(original));
            Assert.That(_manager.UseVelocityPrediction, Is.True);
            Assert.That(_manager.NumFramesForPrediction, Is.EqualTo(3));
            Assert.That(_manager.UseSecondDerivation, Is.False);
            Assert.That(_manager.SecondDerivationMagnitude, Is.EqualTo(.5f));
        });
        _controller.SetPrediction(new PredictionSettings { PredictionHorizonSeconds = .75 });
        _controller.Reset();
        Assert.That(_manager.PredictionHorizonSeconds, Is.EqualTo(original));
    }

    [Test]
    public void RequestedPredictionSamplesPersistWhileRuntimeCapacityShrinksAndGrows()
    {
        _manager.InteractionHistorySize = 3;
        var response = _controller.SetPrediction(new PredictionSettings { NumFramesForPrediction = 100 });
        Assert.That(response.Value!.NumFramesForPrediction, Is.EqualTo(100));
        // Applying saved settings may restore the configured history; explicitly change runtime capacity.
        _manager.InteractionHistorySize = 3;
        Assert.That(_manager.NumFramesForPrediction, Is.EqualTo(3));
        _manager.InteractionHistorySize = 2;
        Assert.That(_manager.NumFramesForPrediction, Is.EqualTo(2));
        _manager.InteractionHistorySize = 120;
        Assert.That(_manager.NumFramesForPrediction, Is.EqualTo(100));
        Assert.That(Configuration().Settings.PredictionSettings.NumFramesForPrediction, Is.EqualTo(100));
        _manager.Type = ObserverType.SingleTouch;
        Assert.That(_manager.NumFramesForPrediction, Is.EqualTo(100), "Observer replacement preserves the request.");

        var reloaded = Configuration();
        var startup = new SettingsService(reloaded, _filter, _manager, _performance, new EventAggregator());
        startup.Init();
        _manager.InteractionHistorySize = 120;
        Assert.That(_manager.NumFramesForPrediction, Is.EqualTo(100), "Startup restores the persisted request.");
    }

    [TestCase(-.1, 3, .5f)]
    [TestCase(1.1, 3, .5f)]
    [TestCase(double.NaN, 3, .5f)]
    [TestCase(.05, 1, .5f)]
    [TestCase(.05, 3, -1f)]
    [TestCase(.05, 3, float.PositiveInfinity)]
    public void InvalidPredictionDoesNotChangeRuntimeSettingsOrBackup(double horizon, int samples, float weight)
    {
        _controller.SetPrediction(new PredictionSettings { PredictionHorizonSeconds = .25 });
        var settings = File.ReadAllText(Path.Combine(_directory, "settings.json"));
        var backup = File.ReadAllText(Path.Combine(_directory, "backup.json"));
        var response = _controller.SetPrediction(new PredictionSettings
        {
            PredictionHorizonSeconds = horizon, NumFramesForPrediction = samples, SecondDerivationMagnitude = weight
        });
        Assert.Multiple(() =>
        {
            Assert.That(response.Result, Is.TypeOf<BadRequestObjectResult>());
            Assert.That(_manager.PredictionHorizonSeconds, Is.EqualTo(.25));
            Assert.That(_configuration.Settings.PredictionSettings.PredictionHorizonSeconds, Is.EqualTo(.25));
            Assert.That(File.ReadAllText(Path.Combine(_directory, "settings.json")), Is.EqualTo(settings));
            Assert.That(File.ReadAllText(Path.Combine(_directory, "backup.json")), Is.EqualTo(backup));
        });
    }

    // Small property-only substitutes avoid hardware/network dependencies. Unexpected commands fail.
    public class PropertyStub : DispatchProxy
    {
        public Dictionary<string, object?> Values { get; } = new();
        protected override object? Invoke(MethodInfo? method, object?[]? arguments)
        {
            var name = method!.Name;
            if (name.StartsWith("set_")) { Values[name[4..]] = arguments![0]; return null; }
            if (name.StartsWith("get_"))
                return Values.TryGetValue(name[4..], out var value) ? value
                    : method.ReturnType.IsValueType ? Activator.CreateInstance(method.ReturnType) : null;
            if (name.StartsWith("add_") || name.StartsWith("remove_") || name is "RegisterReporter" or "UnregisterReporter")
                return null;
            throw new NotSupportedException(name);
        }
    }
    private static T Stub<T>() where T : class => DispatchProxy.Create<T, PropertyStub>();
}
