using Implementation.Interfaces;
using Microsoft.AspNetCore.Mvc;
using NLog;
using Prism.Events;
using ReFlex.Core.Common.Interfaces;
using TrackingServer.Data;
using TrackingServer.Data.Config;
using TrackingServer.Events;
using TrackingServer.Model;
using TrackingServer.Util.JsonFormats;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;

namespace TrackingServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly ConfigurationManager _configManager;
        private readonly IFilterManager _filterManager;
        private readonly IInteractionManager _interactionManager;
        private readonly IPerformanceAggregator _performanceAggregator;
        private readonly IEventAggregator _eventAggregator;

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();


        public SettingsController(
            ConfigurationManager configManager,
            IFilterManager filterManager,
            IInteractionManager interactionManager,
            IDepthImageManager depthImgManager,
            IPerformanceAggregator performanceAggregator,
            IEventAggregator eventAggregator)
        {
            _configManager = configManager;
            _filterManager = filterManager;
            _interactionManager = interactionManager;
            _performanceAggregator = performanceAggregator;
            _eventAggregator = eventAggregator;
        }

        private void RestoreFilterMask()
        {
            _eventAggregator.GetEvent<RequestRestoreFilterMaskEvent>().Publish();
        }

        // GET: api/Settings
        [HttpGet]
        public TrackingServerAppSettings Get()
        {
            return _configManager.Settings;
        }

        // POST: api/Settings
        /// <summary>
        /// updates and saves configuration values
        /// </summary>
        /// <param name="value"></param>
        [HttpPost]
        public void Post([FromBody] TrackingServerAppSettings value)
        {
            // retrieve current value of Filter Mask from Filter Manager
            value.FilterSettingValues.FilterMask = _filterManager.FilterMask;
            _configManager.Update(value);
            UpdateConfig();

            Logger.Info($"Updated {nameof(TrackingServerAppSettings)}. Updated value: {value}.");
        }

        // GET: api/Settings/CanRestore
        [HttpGet("CanRestore")]
        public ActionResult<JsonSimpleValue<bool>> CanRestore()
        {
            return new ActionResult<JsonSimpleValue<bool>>(new JsonSimpleValue<bool> { Name = nameof(ConfigurationManager.CanRestoreBackup), Value = _configManager.CanRestoreBackup });
        }

        // GET: api/Settings/Restore
        [HttpGet("Restore")]
        public ActionResult<TrackingServerAppSettings> Restore()
        {
            _configManager.RestoreBackup();
            RestoreFilterMask();
            return _configManager.Settings;
        }

        // GET: api/Settings/Reset
        [HttpGet("Reset")]
        public ActionResult<TrackingServerAppSettings> Reset()
        {
            _configManager.RestoreDefaults();
            RestoreFilterMask();
            return new ActionResult<TrackingServerAppSettings>(_configManager.Settings);
        }

        // POST: api/Settings/Border
        [HttpPost("Border")]
        public ActionResult<Border> Post([FromBody] Border value)
        {
            _configManager.Settings.FilterSettingValues.BorderValue = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.BorderValue)}. Updated value: {value}.");

            return _configManager.Settings.FilterSettingValues.BorderValue;
        }

        // POST: api/Settings/MinDistanceFromSensor
        [HttpPost("MinDistanceFromSensor")]
        public ActionResult<float> SetMinDistanceFromSensor([FromBody] float value)
        {
            _configManager.Settings.FilterSettingValues.MinDistanceFromSensor = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.MinDistanceFromSensor)}. Updated value: {value}.");

            return _configManager.Settings.FilterSettingValues.MinDistanceFromSensor;
        }

        // POST: api/Settings/Threshold
        [HttpPost("Threshold")]
        public ActionResult<JsonSimpleValue<float>> Threshold([FromBody] float value)
        {
            _configManager.Settings.FilterSettingValues.Threshold = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.Threshold)}. Updated value: {value}.");

            return new JsonSimpleValue<float>
            {
                Name = nameof(FilterSettings.Threshold),
                Value = _configManager.Settings.FilterSettingValues.Threshold
            };
        }

        // POST: api/Settings/MinAngle
        [HttpPost("MinAngle")]
        public ActionResult<JsonSimpleValue<float>> MinAngle([FromBody] float value)
        {
            _configManager.Settings.FilterSettingValues.MinAngle = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.MinAngle)}. Updated value: {value}.");

            return new JsonSimpleValue<float>
            {
                Name = nameof(FilterSettings.MinAngle),
                Value = _configManager.Settings.FilterSettingValues.MinAngle
            };
        }

        // GET: api/Settings/ComputeZeroPlaneDistance
        [HttpGet("ComputeZeroPlaneDistance")]
        public ActionResult<Distance> ComputeZeroPlaneDistance()
        {
            if (_interactionManager == null)
                return _configManager.Settings.FilterSettingValues.DistanceValue;

            var computedDistance = _interactionManager.ComputeZeroPlaneDistance();

            if (!(computedDistance > 0))
                return _configManager.Settings.FilterSettingValues.DistanceValue;

            var distance = _configManager.Settings.FilterSettingValues.DistanceValue;
            distance.Default = computedDistance;
            _configManager.Settings.FilterSettingValues.DistanceValue = distance;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.DistanceValue)}. Updated value: {distance}.");

            return distance;
        }

        // GET: api/Settings/ResetAdvancedLimitationFilter
        [HttpGet("ResetAdvancedLimitationFilter")]
        public ActionResult<JsonSimpleValue<bool>> ResetAdvancedLimitationFilter()
        {
            var result = new JsonSimpleValue<bool>
            {
                Name = "Success",
                Value = false
            };

            if (_interactionManager == null)
                return new ActionResult<JsonSimpleValue<bool>>(result);

            _filterManager.Reset();

            return new ActionResult<JsonSimpleValue<bool>>(result);
        }

        // GET: api/Settings/InitializeAdvancedLimitationFilter
        [HttpGet("InitializeAdvancedLimitationFilter")]
        public ActionResult<JsonSimpleValue<bool>> InitializeAdvancedLimitationFilter()
        {
            var result = new JsonSimpleValue<bool>
            {
                Name = "Success",
                Value = false
            };

            if (_interactionManager == null)
                return new ActionResult<JsonSimpleValue<bool>>(result);

            var zeroPlane = _configManager?.Settings?.FilterSettingValues?.DistanceValue.Default ?? 0;
            var threshold = _configManager?.Settings?.FilterSettingValues?.AdvancedLimitationFilterThreshold ?? 0.01f;
            var samples = _configManager?.Settings?.FilterSettingValues?.AdvancedLimitationFilterSamples ?? 10;

            var initializationSuccessful = _filterManager.UpdateLimitationFilter(zeroPlane, threshold, samples);

            Logger.Info($"Initalized {_configManager?.Settings?.FilterSettingValues?.LimitationFilterType}. Initialization started: {initializationSuccessful}.");

            result.Value = initializationSuccessful;

            return new ActionResult<JsonSimpleValue<bool>>(result);
        }

        // GET: api/Settings/LimitationFilterInitializing
        [HttpGet("LimitationFilterInitializing")]
        public ActionResult<JsonSimpleValue<bool>> LimitationFilterInitializing()
        {
            var result = new JsonSimpleValue<bool>
            {
                Name = "IsInitializing",
                Value = _filterManager.LimitationFilter.IsInitializing
            };

            return new ActionResult<JsonSimpleValue<bool>>(result);
        }

        // GET: api/Settings/LimitationFilterInitState
        [HttpGet("LimitationFilterInitState")]
        public ActionResult<JsonSimpleValue<bool>> LimitationFilterInitState()
        {
            var result = new JsonSimpleValue<bool>
            {
                Name = "IsInitialized",
                Value = _filterManager.LimitationFilter.IsInitialized
            };

            return new ActionResult<JsonSimpleValue<bool>>(result);
        }

        // POST: api/Settings/LimitationFilterType
        [HttpPost("LimitationFilterType")]
        public ActionResult<JsonSimpleValue<bool>> LimitationFilterType([FromBody] FilterSettings settings)
        {
            _configManager.Settings.FilterSettingValues.LimitationFilterType = settings.LimitationFilterType;
            _configManager.Settings.FilterSettingValues.AdvancedLimitationFilterSamples = settings.AdvancedLimitationFilterSamples;
            _configManager.Settings.FilterSettingValues.AdvancedLimitationFilterThreshold = settings.AdvancedLimitationFilterThreshold;
            _configManager.Settings.FilterSettingValues.IsLimitationFilterEnabled = settings.IsLimitationFilterEnabled;
            _configManager.Settings.FilterSettingValues.IsThresholdFilterEnabled = settings.IsThresholdFilterEnabled;
            _configManager.Settings.FilterSettingValues.IsValueFilterEnabled = settings.IsValueFilterEnabled;
            _configManager.Settings.FilterSettingValues.IsBoxFilterEnabled = settings.IsBoxFilterEnabled;
            _configManager.Settings.FilterSettingValues.MeasurePerformance = settings.MeasurePerformance;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.LimitationFilterType)}. Updated value: {settings.LimitationFilterType}.");

            return new ActionResult<JsonSimpleValue<bool>>(
                new JsonSimpleValue<bool> { Name = "success", Value = true });
        }

        // POST: api/Settings/Distance
        [HttpPost("Distance")]
        public ActionResult<Distance> Post([FromBody] Distance value)
        {
            _configManager.Settings.FilterSettingValues.DistanceValue = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.DistanceValue)}. Updated value: {value}.");

            return _configManager.Settings.FilterSettingValues.DistanceValue;
        }

        // POST: api/Settings/Confidence
        [HttpPost("Confidence")]
        public ActionResult<ConfidenceParameter> Post([FromBody] ConfidenceParameter value)
        {
            _configManager.Settings.FilterSettingValues.Confidence = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.Confidence)}. Updated value: {value}.");

            return _configManager.Settings.FilterSettingValues.Confidence;
        }

        // PUT: api/Settings/FilterRadius
        [HttpPut("FilterRadius/{radius}")]
        public ActionResult<JsonSimpleValue<int>> PutRadius(int radius)
        {
            _configManager.Settings.FilterSettingValues.BoxFilterRadius = radius;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.BoxFilterRadius)}. Updated value: {radius}.");

            return new JsonSimpleValue<int>
            {
                Name = nameof(FilterSettings.BoxFilterRadius),
                Value = _configManager.Settings.FilterSettingValues.BoxFilterRadius
            };
        }

        // PUT: api/Settings/FilterPasses
        [HttpPut("FilterPasses/{numPasses}")]
        public ActionResult<JsonSimpleValue<int>> NumPasses(int numPasses)
        {
            _configManager.Settings.FilterSettingValues.BoxFilterNumPasses = numPasses;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.BoxFilterNumPasses)}. Updated value: {numPasses}.");

            return new JsonSimpleValue<int>
            {
                Name = nameof(FilterSettings.BoxFilterNumPasses),
                Value = _configManager.Settings.FilterSettingValues.BoxFilterNumPasses
            };
        }

        // PUT: api/Settings/FilterThreads
        [HttpPut("FilterThreads/{numThreads}")]
        public ActionResult<JsonSimpleValue<int>> NumThreads(int numThreads)
        {
            _configManager.Settings.FilterSettingValues.BoxFilterNumThreads = numThreads;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.BoxFilterNumThreads)}. Updated value: {numThreads}.");

            return new JsonSimpleValue<int>
            {
                Name = nameof(FilterSettings.BoxFilterNumThreads),
                Value = _configManager.Settings.FilterSettingValues.BoxFilterNumThreads
            };
        }

        // POST: api/Settings/UseOptimizedBoxFilter
        [HttpPost("UseOptimizedBoxFilter")]
        public ActionResult<JsonSimpleValue<bool>> NumThreads([FromBody] JsonSimpleValue<bool> useOptimizedBoxFilter)
        {
            _configManager.Settings.FilterSettingValues.UseOptimizedBoxFilter = useOptimizedBoxFilter?.Value ?? false;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.UseOptimizedBoxFilter)}. Updated value: {useOptimizedBoxFilter?.Value}.");

            return new JsonSimpleValue<bool>
            {
                Name = nameof(FilterSettings.UseOptimizedBoxFilter),
                Value = _configManager.Settings.FilterSettingValues.UseOptimizedBoxFilter
            };
        }

        // POST: api/Settings/Prediction
        [HttpPost("Prediction")]
        public PredictionSettings Post([FromBody] PredictionSettings value)
        {
            _configManager.Settings.PredictionSettings = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(PredictionSettings)}. Updated value: {value}.");

            return _configManager.Settings.PredictionSettings;
        }

        // POST: api/Settings/Smoothing
        [HttpPost("Smoothing")]
        public SmoothingParameter Post([FromBody] SmoothingParameter value)
        {
            _configManager.Settings.FilterSettingValues.SmoothingValues = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.SmoothingValues)}. Updated value: {value}.");

            return _configManager.Settings.FilterSettingValues.SmoothingValues;
        }

        // POST: api/Settings/ExtremumsCheck
        [HttpPost("ExtremumsCheck")]
        public ExtremumDescriptionSettings Post([FromBody] ExtremumDescriptionSettings value)
        {
            _configManager.Settings.FilterSettingValues.ExtremumSettings = value;
            UpdateConfig();

            Logger.Info($"Updated {nameof(FilterSettings.ExtremumSettings)}. Updated value: {value}.");

            return _configManager.Settings.FilterSettingValues.ExtremumSettings;
        }

        //// PUT: api/Settings/5
        //[HttpPut("{id}")]
        //public void Put(int id, [FromBody] string value)
        //{
        //}


        [HttpPost("LoadSettings")]
        public ActionResult<TrackingServerAppSettings> LoadSettings([FromBody] TrackingServerAppSettings clientSettings)
        {
            _configManager.LoadSettings(clientSettings);
            return _configManager.Settings;
        }


        private void UpdateConfig()
        {
            _eventAggregator.GetEvent<RequestConfigurationUpdateEvent>().Publish(false);
        }
    }
}
