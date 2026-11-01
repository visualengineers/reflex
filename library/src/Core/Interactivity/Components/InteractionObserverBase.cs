using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Interactivity.Util;
using Math = System.Math;

namespace ReFlex.Core.Interactivity.Components
{
    public abstract class InteractionObserverBase : IInteractionObserver, IPerformanceReporter
    {
        #region Fields

        private readonly Stopwatch _stopWatch = new();

        private readonly InteractionSmoothingBehaviour _smoothingBehaviour;
        private int _numSmoothingFrames = 5;
        private int _historySize = 25;
        private double _contactRetentionSeconds = .1;
        private float _touchMergeDistance2d = 64f;
        private float _depthScale = 100.0f;
        private FilterType _filterType;
        private float _maxConfidence;
        private int _extremumTypeCheckRadius;
        private int _extremumTypeCheckNumSamples;

        private Tuple<int, int>[] _fixedSamples = Array.Empty<Tuple<int, int>>();
        private Tuple<int, int>[] _stochasticSamples = Array.Empty<Tuple<int, int>>();

        #endregion

        #region Properties

        /// <summary>
        /// Gets or sets the distance.
        /// </summary>
        /// <value>
        /// The distance.
        /// </value>
        public float Distance { get; set; }

        /// <summary>
        /// Gets or sets the minimum depth.
        /// </summary>
        /// <value>
        /// The maximum depth.
        /// </value>
        public float MinDistance { get; set; }

        /// <summary>
        /// Gets or sets the maximum depth.
        /// </summary>
        /// <value>
        /// The maximum depth.
        /// </value>
        public float MaxDistance { get; set; }

        /// <summary>
        /// defines how many points should be checked to determine the type of the extremum
        /// </summary>
        public int ExtremumTypeCheckNumSamples
        {
            get => _extremumTypeCheckNumSamples;
            set
            {
                if (_extremumTypeCheckNumSamples == value)
                    return;
                _extremumTypeCheckNumSamples = value;
                UpdateSamples();
            }
        }

        /// <summary>
        /// The pixel radius in which the points are sampled for deriving the type of the local extremum
        /// </summary>
        public int ExtremumTypeCheckRadius
        {
            get => _extremumTypeCheckRadius;
            set
            {
                if (_extremumTypeCheckRadius == value)
                    return;
                _extremumTypeCheckRadius = value;
                UpdateSamples();
            }
        }

        /// <summary>
        /// Which ratio of "correctly aligned" points should match to distinguish between Undefined or Minimum/Maximum ?
        /// </summary>
        public float ExtremumTypeCheckFittingPercentage { get; set; }

        /// <summary>
        /// Defines how neighboring the points are sampled for determining the type of extremum.
        /// </summary>
        public ExtremumTypeCheckMethod ExtremumTypeCheckMethod { get; set; }

        public double PredictionHorizonSeconds
        {
            get => _smoothingBehaviour.PredictionHorizonSeconds;
            set => _smoothingBehaviour.PredictionHorizonSeconds = value;
        }

        public bool UseVelocityPrediction
        {
            get => _smoothingBehaviour.UseVelocityForMapping;
            set => _smoothingBehaviour.UseVelocityForMapping = value;
        }
        public int NumFramesForPrediction
        {
            get => _smoothingBehaviour.NumFramesForPrediction;
            set => _smoothingBehaviour.NumFramesForPrediction = value;
        }
        public bool UseSecondDerivation
        {
            get => _smoothingBehaviour.UseSecondDerivation;
            set => _smoothingBehaviour.UseSecondDerivation = value;
        }
        public float SecondDerivationMagnitude
        {
            get => _smoothingBehaviour.SecondDerivationMagnitude;
            set => _smoothingBehaviour.SecondDerivationMagnitude = value;
        }

        public int InteractionHistorySize
        {
            get => _smoothingBehaviour?.NumFramesHistory ?? _historySize;
            set
            {
                _historySize = Math.Max(0, value);
                if (_smoothingBehaviour != null)
                {
                    _smoothingBehaviour.NumFramesHistory = _historySize;
                    // update depending smoothing/filter values
                    NumSmoothingFrames = _numSmoothingFrames;
                }
            }
        }

        public int NumSmoothingFrames
        {
            get => _smoothingBehaviour?.NumFramesSmoothing ?? _numSmoothingFrames;
            set
            {
                _numSmoothingFrames = Math.Clamp(value, 0, InteractionHistorySize);
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.NumFramesSmoothing = _numSmoothingFrames;
            }
        }

        private static double ValidateContactRetention(double value) =>
            double.IsFinite(value) && value >= 0 ? value :
                throw new ArgumentOutOfRangeException(nameof(value), "Contact retention must be finite and non-negative seconds.");

        public float ConfidenceGainPerSecond
        {
            get => _smoothingBehaviour.ConfidenceGainPerSecond;
            set => _smoothingBehaviour.ConfidenceGainPerSecond = value;
        }
        public float ConfidenceDecayPerSecond
        {
            get => _smoothingBehaviour.ConfidenceDecayPerSecond;
            set => _smoothingBehaviour.ConfidenceDecayPerSecond = value;
        }

        public double ContactRetentionSeconds
        {
            get => _smoothingBehaviour?.ContactRetentionSeconds ?? _contactRetentionSeconds;
            set
            {
                _contactRetentionSeconds = ValidateContactRetention(value);
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.ContactRetentionSeconds = _contactRetentionSeconds;
            }
        }

        public float TouchMergeDistance2D
        {
            get => _touchMergeDistance2d;
            set
            {
                _touchMergeDistance2d = value;
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.TouchMergeDistance2D = value;
            }
        }

        public float DepthScale
        {
            get => _depthScale;
            set
            {
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.DepthScale = value;
                _depthScale = value;
            }
        }

        public FilterType FilterType
        {
            get => _filterType;
            set
            {
                _filterType = value;
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.UpdateFilterType(_filterType);
            }
        }


        /// <summary>
        /// Gets or sets the minimum angle.
        /// </summary>
        /// <value>
        /// The minimum angle.
        /// </value>
        public virtual float MinAngle { get; set; }

        /// <summary>
        /// Gets or sets the minimum confidence.
        /// </summary>
        /// <value>
        /// The minimum confidence.
        /// </value>
        public virtual float MinConfidence { get; set; }

        /// <summary>
        /// Gets or sets the maximum confidence.
        /// </summary>
        /// <value>
        /// The maximum confidence.
        /// </value>
        public virtual float MaxConfidence
        {
            get => _maxConfidence;
            set
            {
                _maxConfidence = value;
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.MaxConfidence = (int) MaxConfidence;
            }
        }

        public bool MeasurePerformance { get; set; }

        protected int FrameId { get; private set; }

        #region Abstract Members

        public abstract ObserverType Type { get; }
        public abstract PointCloud3 PointCloud { get; set; }
        public abstract VectorField2 VectorField { get; set; }

        public event EventHandler<IList<Interaction>> NewInteractions;
        public event EventHandler<IList<InteractionVelocity>> NewVelocities;

        public event EventHandler<PerformanceDataItem> PerformanceDataUpdated;

        public event EventHandler<IList<InteractionFrame>> InteractionHistoryUpdated;

        #endregion

        #region Constructor

        protected InteractionObserverBase()
        {
            _smoothingBehaviour = new InteractionSmoothingBehaviour(InteractionHistorySize);
            NumSmoothingFrames = _numSmoothingFrames;
            ContactRetentionSeconds = _contactRetentionSeconds;
            TouchMergeDistance2D = _touchMergeDistance2d;
            DepthScale = _depthScale;
            MaxConfidence = _maxConfidence;
            FilterType = _filterType;
        }

        #endregion

        public void UpdateFrameId(int frameId)
        {
            FrameId = frameId;
        }

        #endregion

        protected abstract Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance);

        protected virtual Task ReportPerformance(ProcessPerformance performance) => Task.CompletedTask;

        protected virtual Task<ProcessingResult> CheckInitialState()
        {
          return Task.FromResult(new ProcessingResult(ProcessServiceStatus.Available));
        }

        private double? _observationTime;
        private readonly object _trackingSync = new();

        public async Task<ProcessingResult> Update(TrackingObservation observation)
        {
            PointCloud = observation.PointCloud;
            VectorField = observation.VectorField;
            _observationTime = observation.TimestampSeconds;
            try { return await Update(); }
            finally { _observationTime = null; }
        }

        public void AdvanceTime(double timestampSeconds)
        {
            lock (_trackingSync) Publish(_smoothingBehaviour.OutputAt(timestampSeconds));
        }

        private void Publish(InteractionFrame frame)
        {
            var selected = SelectSmoothedInteractions(frame.Interactions).ToList();
            var published = ApplyConfidenceFilter(selected).ToList();
            var publishedIds = published.Select(item => item.TouchId).ToHashSet();
            var selectedIds = selected.Select(item => item.TouchId).ToHashSet();
            // Diagnostics include hidden tracks and are captured before any external callbacks.
            var velocities = _smoothingBehaviour.GetVelocities(frame);
            foreach (var velocity in velocities)
            {
                velocity.Width = PointCloud?.SizeX ?? 0;
                velocity.Height = PointCloud?.SizeY ?? 0;
                velocity.IsPublished = publishedIds.Contains(velocity.TouchId);
                velocity.SuppressionReason = velocity.IsPublished ? "" :
                    selectedIds.Contains(velocity.TouchId) ? "confidence" : "observer-selection";
            }
            OnNewInteractions(published);
            NewVelocities?.Invoke(this, velocities);
        }

        public virtual async Task<ProcessingResult> Update()
        {
            var processResult = await CheckInitialState();

            if (processResult.ServiceStatus != ProcessServiceStatus.Available)
            {
              AdvanceTime(GetTimestampSeconds());
              UpdatePerformanceMetrics(new ProcessPerformance(), DateTime.Now.Ticks);
              return processResult;
            }

            var timestampSeconds = _observationTime ?? GetTimestampSeconds();
            var observationCloud = PointCloud;
            var processingDateTime = DateTime.Now.Ticks;

            if (MeasurePerformance)
            {
              _stopWatch.Start();
            }

            var processed = await Analyze(processResult.PerformanceMeasurement);

            var candidates = processed.Item1;
            var perfItem = processed.Item2;

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.Update = _stopWatch.Elapsed - perfItem.Preparation;
                _stopWatch.Reset();
            }

            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            var interactions =  ConvertDepthValue(candidates.ToList());

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.ConvertDepthValue = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance)
            {
              _stopWatch.Start();
            }

            var processedInteractions = ComputeExtremumType(interactions, observationCloud.AsJaggedArray());

            var cleanedUpInteractions = RemoveExtremumsBetweenTouches(processedInteractions);

            if (MeasurePerformance)
            {
              _stopWatch.Stop();
              perfItem.ComputeExtremumType = _stopWatch.Elapsed;
              _stopWatch.Reset();
            }


            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            Task reportTask;
            lock (_trackingSync)
            {
                var frame = ComputeSmoothingValue(cleanedUpInteractions, timestampSeconds);

                if (MeasurePerformance)
                {
                    _stopWatch.Stop();
                    perfItem.Smoothing = _stopWatch.Elapsed;
                    _stopWatch.Reset();
                }

                // Remote latency must not publish a contact after its observation deadline.
                if (_observationTime.HasValue && InteractionHistorySize > 0)
                    frame = _smoothingBehaviour.OutputAt(Math.Max(timestampSeconds, GetTimestampSeconds()), false);

                // Populate optional remote stage timings before publishing the shared dictionary.
                reportTask = MeasurePerformance ? ReportPerformance(perfItem) : Task.CompletedTask;
                processResult.PerformanceMeasurement = perfItem;
                UpdatePerformanceMetrics(perfItem, processingDateTime);

                Publish(frame);
            }

            await reportTask;

            return processResult;
        }

        /// <summary>Limits the smoothed output without changing the tracking history.</summary>
        protected virtual IEnumerable<Interaction> SelectSmoothedInteractions(IEnumerable<Interaction> interactions)
            => interactions;

        /// <summary>Monotonic observation time captured before Analyze, including remote work.</summary>
        protected virtual double GetTimestampSeconds() => (double)Stopwatch.GetTimestamp() / Stopwatch.Frequency;

        protected InteractionFrame ComputeSmoothingValue(IList<Interaction> rawInteractions, double? timestampSeconds = null)
        {
            var result = _smoothingBehaviour.Update(rawInteractions, timestampSeconds ?? GetTimestampSeconds());
            InteractionHistoryUpdated?.Invoke(this, _smoothingBehaviour.InteractionsFramesCache);

            return result;
        }

        protected virtual ExtremumDescription ComputeExtremumType(Point3[][] pointsArray, int xPos, int yPos)
        {
            if (ExtremumTypeCheckMethod == ExtremumTypeCheckMethod.Global)
            {
                // Global skips neighbourhood validation, but retains the same sensor-depth
                // convention as the spatial classifier: pushes are minima, pulls maxima.
                var depth = pointsArray[xPos][yPos].Z;
                var type = !float.IsFinite(depth) || depth == Distance ? ExtremumType.Undefined
                    : depth < Distance ? ExtremumType.Minimum : ExtremumType.Maximum;
                return new ExtremumDescription
                {
                    Type = type,
                    NumFittingPoints = type == ExtremumType.Undefined ? 0 : ExtremumTypeCheckNumSamples,
                    PercentageFittingPoints = type == ExtremumType.Undefined ? 0 : 1.0f
                };
            }

            var xMax = pointsArray.Length - 1;
            var yMax = xMax > 0 ? pointsArray[0].Length - 1 : 0;

            // refZ is the absolute distance from sensor
            var refZ = Math.Abs(pointsArray[xPos][yPos].Z);

            var numCloser = 0;
            var numFarther = 0;

            Tuple<int, int>[] samples;
            switch (ExtremumTypeCheckMethod)
            {
                case ExtremumTypeCheckMethod.StochasticStatic:
                    samples = _stochasticSamples;
                    break;
                case ExtremumTypeCheckMethod.StochasticDynamic:
                    samples = GenerateSamples();
                    break;
                case ExtremumTypeCheckMethod.Global:
                    throw new ArgumentException("invalid Method 'Global' at this point.");
                case ExtremumTypeCheckMethod.FixedRadius:
                default:
                    samples = _fixedSamples;
                    break;
            }

            for (var i = 0; i < samples.Length; i++)
            {
                var sample = GetSample(pointsArray, xPos, yPos, samples, i, xMax, yMax);
                if (Math.Abs(sample.Z) > refZ)
                    numFarther++;
                else
                    numCloser++;
            }


            var ratioMax = ExtremumTypeCheckNumSamples > 0 ? (float)numCloser / ExtremumTypeCheckNumSamples : 0;
            var ratioMin = ExtremumTypeCheckNumSamples > 0 ? (float)numFarther / ExtremumTypeCheckNumSamples : 0;

            if (numCloser > numFarther && ratioMax > ExtremumTypeCheckFittingPercentage)
            {
                return new ExtremumDescription
                {
                    Type = ExtremumType.Maximum,
                    NumFittingPoints = numCloser,
                    PercentageFittingPoints = ratioMax
                };
            }

            if (numFarther > numCloser && ratioMin > ExtremumTypeCheckFittingPercentage)
            {
                return new ExtremumDescription
                {
                    Type = ExtremumType.Minimum,
                    NumFittingPoints = numFarther,
                    PercentageFittingPoints = ratioMin
                };
            }

            return new ExtremumDescription
            {
                Type = ExtremumType.Undefined,
                NumFittingPoints = Math.Max(numCloser, numFarther),
                PercentageFittingPoints = Math.Max(ratioMin, ratioMax)
            };

        }

        protected List<Interaction> ConvertDepthValue(List<Interaction> interactions)
        {
            var result = new List<Interaction>();

            foreach (var item in interactions)
            {
                if (item?.Position == null || !float.IsFinite(item.Position.Z) ||
                    Math.Abs(item.Position.Z - Distance) <= MinDistance)
                    continue;

                if (item.Position.Z < Distance)
                {
                    item.Type = InteractionType.Push;
                    var depth = (Distance - item.Position.Z - MinDistance) / (MinDistance - MaxDistance);

                    if (depth > 0)
                        continue;

                    if (depth < -1)
                        depth = -1;

                    item.Position.Z = depth;
                }
                else
                {
                    item.Type = InteractionType.Pull;
                    var depth = (item.Position.Z - MinDistance - Distance) / (MaxDistance - MinDistance);

                    if (depth < 0)
                        continue;

                    if (depth > 1)
                        depth = 1;

                    item.Position.Z = depth;
                }

                result.Add(item);
            }

            return result;
        }

        protected IEnumerable<Interaction> ApplyConfidenceFilter(IEnumerable<Interaction> interactions)
        {
            return interactions.ToArray().Where(item => item.Confidence > MinConfidence);
        }

        protected List<Interaction> ComputeExtremumType(List<Interaction> interactions, Point3[][] pointsArray)
        {
            interactions.ForEach(interaction =>
                interaction.ExtremumDescription = ComputeExtremumType(pointsArray, (int)interaction.Position.X, (int)interaction.Position.Y));

            return interactions;
        }

        /// <summary>
        /// generic approach: removes all maximums below the surface and all minimums above the surface. Removal is based on the ExtremumDescription.
        /// Points witch <see cref="ExtremumType.Undefined"/> are also removed.
        /// </summary>
        /// <param name="interactions">the list of preprocessed interactions with valid ExtremumDescription</param>
        /// <returns></returns>
        protected List<Interaction> RemoveExtremumsBetweenTouches(List<Interaction> interactions)
        {
          return interactions.Where((touch) =>
            // invalid or undefined ExtremumType
            touch.ExtremumDescription != null && touch.ExtremumDescription.Type != ExtremumType.Undefined &&
            // minimums below the surface
            ((touch.Position.Z < 0 && touch.ExtremumDescription.Type == ExtremumType.Minimum) ||
             // maximums above the surface
             (touch.Position.Z > 0 && touch.ExtremumDescription.Type == ExtremumType.Maximum))

          ).ToList();
        }

        protected void UpdatePerformanceMetrics(ProcessPerformance perfItem, long startTime)
        {
            var pData = new PerformanceDataItem
            {
                FrameId = Convert.ToInt32(FrameId),
                FrameStart = startTime,
                FrameEnd = DateTime.Now.Ticks,
                Process = perfItem,
                Stage = PerformanceDataStage.ProcessingData
            };

            PerformanceDataUpdated?.Invoke(this, pData);
        }

        protected void OnNewInteractions(List<Interaction> args) => NewInteractions?.Invoke(this, args);

        /// <summary>
        /// Calculates the average distance for the currently stored PointCloud.
        /// </summary>
        /// <returns></returns>
        public float CalculateAverageDistance()
        {
            var sum = 0f;
            var points = PointCloud?.AsArray();

            if (points == null)
                return sum;

            var numValidSamples = 0;

            for (var i = 0; i < points.Length; ++i)
            {
                if (!points[i].IsValid || points[i].IsFiltered)
                    continue;

                numValidSamples++;
                sum += points[i].Z;
            }

            return (float) decimal.Round((decimal) (sum / numValidSamples), 2);
        }

        private static Point3 GetSample(Point3[][] pointsArray, int xPos, int yPos, Tuple<int, int>[] samples, int i, int xMax, int yMax)
        {
            var xIdx = xPos + samples[i].Item1;
            xIdx = Math.Min(Math.Max(xIdx, 0), xMax);

            var yIdx = yPos + samples[i].Item2;
            yIdx = Math.Min(Math.Max(yIdx, 0), yMax);
            var sample = pointsArray[xIdx][yIdx];

            return sample;
        }

        private Tuple<int, int>[] GenerateSamples()
        {
            var result = new List<Tuple<int, int>>();

            var rnd = new Random();

            var min = (int)Math.Floor(0.5f * ExtremumTypeCheckRadius);
            var max = ExtremumTypeCheckRadius;

            for (var i = 0; i < ExtremumTypeCheckNumSamples; i++)
            {
                var xStochastic = rnd.Next(min, max);
                var yStochastic = rnd.Next(min, max);
                // Sample all quadrants while preserving the configured offset range.
                if (rnd.Next(2) == 0)
                    xStochastic = -xStochastic;
                if (rnd.Next(2) == 0)
                    yStochastic = -yStochastic;

                result.Add(new Tuple<int, int>(xStochastic, yStochastic));
            }

            return result.ToArray();
        }

        private void UpdateSamples()
        {
            var samplesFixed = new List<Tuple<int, int>>();

            for (var i = 0; i < ExtremumTypeCheckNumSamples; i++)
            {
                var p = (double)i / ExtremumTypeCheckNumSamples;
                var xFixed = (int) Math.Floor(ExtremumTypeCheckRadius * Math.Cos(p * 2 * Math.PI));
                var yFixed = (int) Math.Floor(ExtremumTypeCheckRadius * Math.Sin(p * 2 * Math.PI));

                samplesFixed.Add(new Tuple<int, int>(xFixed, yFixed));
            }
            _fixedSamples = samplesFixed.ToArray();

            _stochasticSamples = GenerateSamples();
        }


    }
}
