using System;
using System.Collections.Generic;
using System.Linq;
using NLog;
using System.Diagnostics;
using MathNet.Numerics;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Filtering.Components;
using ReFlex.Core.Interactivity.Util;
using Math = System.Math;

namespace ReFlex.Core.Interactivity.Components
{
    public class InteractionSmoothingBehaviour
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        #region Fields

        private List<InteractionFrame> _interactionFrames = new List<InteractionFrame>();

        private sealed class Track
        {
            public Interaction LastMeasurement { get; set; }
            public List<(double Time, Interaction Measurement)> Samples { get; } = new();
            public Interaction Smoothed { get; set; }
            public ButterworthFilter Butterworth { get; set; }
            public int LastSeenFrame { get; set; }
            public double LastSeenTime { get; set; }
            public double ConfidenceUpdatedAt { get; set; }
            public float Confidence { get; set; }
            public Point3 MatchingPosition { get; set; }
        }

        private readonly Dictionary<int, Track> _tracks = new();
        private int _numFramesHistory;
        private int _numFramesSmoothing;
        private int _numFramesForPrediction = 3;
        private float _secondDerivationMagnitude = .5f;
        private double _contactRetentionSeconds = .1;

        private double? _timestampSeconds;
        private double _predictionHorizonSeconds = .05;
        private float _confidenceDecayPerSecond = 30;
        private float _confidenceGainPerSecond = 30;
        private int _frameId = 0;
        private int _maxTouchId = 0;
        private FilterType _type = FilterType.None;
        private IPointFilter _filter;

        private float _depthScale = 500f;

        #endregion

        #region Properties

        public float TouchMergeDistance2D { get; set; } = 64f;

        /// <summary>Maximum stored frames; zero disables tracking and smoothing.</summary>
        public int NumFramesHistory
        {
            get => _numFramesHistory;
            set
            {
                _numFramesHistory = Math.Max(0, value);
                NumFramesSmoothing = _numFramesSmoothing;
                NumFramesForPrediction = _numFramesForPrediction;
                UpdateInteractionFramesList();
                if (_numFramesHistory == 0)
                    _tracks.Clear();
                UpdateFilterType(_type);
            }
        }

        public int NumFramesSmoothing
        {
            get => _numFramesSmoothing;
            set
            {
                var bounded = Math.Clamp(value, 0, NumFramesHistory);
                if (_numFramesSmoothing != bounded)
                    foreach (var track in _tracks.Values) track.Butterworth = null;
                _numFramesSmoothing = bounded;
                UpdateFilterType(_type);
            }
        }

        private static double ValidateContactRetention(double value) =>
            double.IsFinite(value) && value >= 0 ? value :
                throw new ArgumentOutOfRangeException(nameof(value), "Contact retention must be finite and non-negative seconds.");

        /// <summary>Maximum elapsed seconds since the last measurement, inclusive; independent of history capacity.</summary>
        public double ContactRetentionSeconds
        {
            get => _contactRetentionSeconds;
            set => _contactRetentionSeconds = ValidateContactRetention(value);
        }

        public bool UseVelocityForMapping { get; set; }
        public bool UseSecondDerivation { get; set; }
        public int NumFramesForPrediction
        {
            get => _numFramesForPrediction;
            set => _numFramesForPrediction = Math.Clamp(value, Math.Min(2, NumFramesHistory), NumFramesHistory);
        }
        public float SecondDerivationMagnitude
        {
            get => _secondDerivationMagnitude;
            set => _secondDerivationMagnitude = float.IsFinite(value) && value >= 0 && value <= 1
                ? value : throw new ArgumentOutOfRangeException(nameof(value));
        }

        /// <summary>Explicit diagnostic forecast horizon; matching always uses the actual frame time.</summary>
        public double PredictionHorizonSeconds
        {
            get => _predictionHorizonSeconds;
            set => _predictionHorizonSeconds = double.IsFinite(value) && value >= 0 && value <= 1
                ? value : throw new ArgumentOutOfRangeException(nameof(value));
        }

        /// <summary>Loss of confidence per second without measurements; zero disables decay.</summary>
        public float ConfidenceDecayPerSecond
        {
            get => _confidenceDecayPerSecond;
            set => _confidenceDecayPerSecond = float.IsFinite(value) && value >= 0
                ? value : throw new ArgumentOutOfRangeException(nameof(value));
        }

        /// <summary>Confirmation gained per observed second; missing intervals never earn confidence.</summary>
        public float ConfidenceGainPerSecond
        {
            get => _confidenceGainPerSecond;
            set => _confidenceGainPerSecond = float.IsFinite(value) && value >= 0
                ? value : throw new ArgumentOutOfRangeException(nameof(value));
        }

        public int CurrentFrameId => _frameId;
        public int CurrentMaxId => _maxTouchId;

        public int MaxConfidence { get; set; }

        public float DepthScale
        {
            get => _depthScale;
            set => _depthScale = float.IsFinite(value) && value > 0
                ? value : throw new ArgumentOutOfRangeException(nameof(value), "Depth scale must be finite and positive.");
        }

        public InteractionFrame[] InteractionsFramesCache => _interactionFrames
            .Select(frame => new InteractionFrame(frame.FrameId,
                frame.Interactions.Select(interaction => new Interaction(interaction)).ToList(), frame.TimestampSeconds)).ToArray();

        #endregion

        #region Constructor

        public InteractionSmoothingBehaviour(int numFramesHistory)
        {
            NumFramesHistory = numFramesHistory;
        }

        #endregion

        #region public Methods

        public void Reset()
        {
            _frameId = 0;
            _timestampSeconds = null;
            _maxTouchId = 0;
            _interactionFrames.Clear();
            _tracks.Clear();
        }

        public void UpdateFilterType(FilterType type)
        {
            if (_type != type)
                foreach (var track in _tracks.Values) track.Butterworth = null;
            _type = type;

            switch (type)
            {
                case FilterType.MovingAverage:
                    _filter = new SimpleMovingAverageFilter(Math.Max(1, NumFramesSmoothing));
                    break;
                case FilterType.WeightedMovingAverage:
                    _filter = new WeightedMovingAverageFilter(Math.Max(1, NumFramesSmoothing));
                    break;
                case FilterType.PolynomialFit:
                    _filter = new PolynomialFitFilter();
                    break;
                case FilterType.WeightedPolynomialFit:
                    _filter = new WeightedPolynomialFitFilter();
                    break;
                case FilterType.SavitzkyGolay:
                {
                    var sidePoints = Math.Max(0, (NumFramesSmoothing - 1) / 2);
                    var order = Math.Min(sidePoints, 3);
                    _filter = new SavitzkyGolayFilter(sidePoints, order);
                    break;
                }
                case FilterType.Butterworth:
                    _filter = new ButterworthFilter();
                    break;
                default:
                    _filter = null;
                    break;
            }

            Logger.Info($"switched Interaction Processing Smoothing Filter to {_filter?.GetType().FullName ?? "None\""}");
        }

        public InteractionFrame Update(IList<Interaction> rawInteractions) =>
            Update(rawInteractions, (double)Stopwatch.GetTimestamp() / Stopwatch.Frequency);

        /// <summary>
        /// Process one observation frame at a strictly increasing monotonic timestamp in seconds.
        /// Callers with capture timestamps may supply them here. Invalid times are rejected before
        /// mutating tracking state; Interaction.Time remains the legacy wall-clock field.
        /// </summary>
        public InteractionFrame Update(IList<Interaction> rawInteractions, double timestampSeconds)
        {
            if (!double.IsFinite(timestampSeconds) ||
                (_timestampSeconds.HasValue && timestampSeconds <= _timestampSeconds.Value))
                throw new ArgumentOutOfRangeException(nameof(timestampSeconds), "Frame times must be finite and strictly increasing.");
            _timestampSeconds = timestampSeconds;
            _frameId++;

            // Only internal copies are assigned IDs or retained in the tracking history.
            var candidates = rawInteractions.Take(20).Select(item => new Interaction(item)).ToList();
            var mappedInteractionIds = MapClosestInteraction(candidates);
            var newFrame = new InteractionFrame(_frameId, mappedInteractionIds, timestampSeconds);

            // With history disabled, still publish current measurements, using fresh IDs each frame.
            if (NumFramesHistory == 0)
            {
                _tracks.Clear();
                return newFrame;
            }

            _interactionFrames.Add(newFrame);
            UpdateInteractionFramesList();
            var result = new InteractionFrame(_frameId, timestampSeconds);
            foreach (var pair in _tracks.OrderBy(pair => pair.Key).ToArray())
            {
                var missingFrames = _frameId - pair.Value.LastSeenFrame;
                if (timestampSeconds > pair.Value.LastSeenTime + ContactRetentionSeconds)
                {
                    // Ended tracks are removed permanently, even while their measurements remain cached.
                    _tracks.Remove(pair.Key);
                    continue;
                }

                var smoothed = missingFrames == 0 ? SmoothInteraction(pair.Key)
                    : new Interaction(pair.Value.Smoothed ?? pair.Value.LastMeasurement);
                if (missingFrames == 0) pair.Value.Smoothed = new Interaction(smoothed);
                if (smoothed == null)
                    continue;
                if (missingFrames > 0)
                {
                    DecayConfidence(pair.Value, timestampSeconds);
                    smoothed.TrackingState = InteractionTrackingState.Lost;
                }
                smoothed.Confidence = pair.Value.Confidence;
                result.Interactions.Add(smoothed);
            }

            return result;
        }

        /// <summary>Age publication without inventing a sensor observation or changing the measured
        /// sample clock. Expiry is permanent; confidence during sensor gaps is projected from live state.</summary>
        public InteractionFrame OutputAt(double timestampSeconds, bool markLost = true)
        {
            if (!double.IsFinite(timestampSeconds) || (_timestampSeconds.HasValue && timestampSeconds < _timestampSeconds))
                throw new ArgumentOutOfRangeException(nameof(timestampSeconds));
            var output = new InteractionFrame(_frameId, timestampSeconds);
            foreach (var pair in _tracks.OrderBy(pair => pair.Key).ToArray())
            {
                var track = pair.Value;
                if (timestampSeconds > track.LastSeenTime + ContactRetentionSeconds)
                {
                    _tracks.Remove(pair.Key);
                    continue;
                }
                var item = new Interaction(track.Smoothed ?? track.LastMeasurement);
                if (markLost || track.LastSeenFrame != _frameId)
                {
                    item.TrackingState = InteractionTrackingState.Lost;
                    item.Confidence = Math.Max(0, track.Confidence - (float)(ConfidenceDecayPerSecond *
                        (timestampSeconds - track.ConfidenceUpdatedAt)));
                }
                else item.Confidence = track.Confidence;
                output.Interactions.Add(item);
            }
            return output;
        }

        #endregion

        /// <summary>
        /// order list of frames by frame id descending and remove old frames
        /// </summary>
        private void UpdateInteractionFramesList()
        {
            if (_interactionFrames.Count > NumFramesHistory)
            {
                try
                {
                    _interactionFrames = _interactionFrames.OrderByDescending(frame => frame.FrameId)
                        .Take(NumFramesHistory).ToList();
                }
                catch (Exception e)
                {
                    Logger.Error(e, $"Exception catched in {GetType()}.{nameof(this.UpdateInteractionFramesList)}.");
                }

            }
        }

        /// <summary>
        /// replaces the frame in the cache with the updated frame (if FrameId is existing, otherwise, nothing is changed)
        /// </summary>
        /// <param name="updatedFrame">Frame containing updated values</param>
        public void UpdateCachedFrame(InteractionFrame updatedFrame)
        {
          var frameIdxToBeReplaced = _interactionFrames.FindIndex((f) => f.FrameId == updatedFrame.FrameId);
          if (frameIdxToBeReplaced < 0)
            return;

          // _interactionFrames[frameIdxToBeReplaced] = updatedFrame;
          _interactionFrames[frameIdxToBeReplaced].Interactions.ForEach((interaction) =>
          {
            var updatedInteraction =
              updatedFrame.Interactions.FirstOrDefault((update) => update.TouchId == interaction.TouchId);
            if (updatedInteraction != null)
            {
              interaction.Confidence = updatedInteraction.Confidence;
              if (_tracks.TryGetValue(interaction.TouchId, out var track) && track.LastSeenFrame == updatedFrame.FrameId)
                  track.Confidence = Math.Clamp(updatedInteraction.Confidence, 0, Math.Max(0, MaxConfidence));
              interaction.ExtremumDescription = new Interaction(updatedInteraction).ExtremumDescription;

            }
          });
        }

        /// <summary>
        /// Apply smoothing according to chosen filter type.
        /// Extracts touches of a given id from frames history and  sends them to smoothing algorithm
        /// </summary>
        /// <param name="touchId">the id of the touch, which should be smoothed</param>
        /// <returns>Interaction (last entry in history) with smoothed position</returns>
        private Interaction SmoothInteraction(int touchId)
        {
            var track = _tracks[touchId];
            // A type transition starts a new smoothing segment; motion in XY may remain continuous.
            var samples = track.Samples.AsEnumerable().Reverse()
                .TakeWhile(sample => sample.Measurement.Type == track.LastMeasurement.Type).Reverse().ToArray();
            var interactionsHistory = samples.Select(sample => new Interaction(sample.Measurement)).ToList();
            var smooth = new Interaction(track.LastMeasurement);
            if (_type == FilterType.Butterworth && NumFramesSmoothing > 0)
            {
                track.Butterworth ??= new ButterworthFilter();
                smooth.Position = track.Butterworth.ProcessSample(track.LastMeasurement.Position, track.LastSeenTime);
                if (Math.Sign(smooth.Position.Z) != Math.Sign(track.LastMeasurement.Position.Z))
                    smooth.Position.Z = track.LastMeasurement.Position.Z;
                return smooth;
            }

            var raw = interactionsHistory.Select(interaction => interaction.Position).ToList();

            if (NumFramesSmoothing > 0 &&
                smooth != null && raw.Count >= NumFramesSmoothing &&
                _type != FilterType.None && _filter != null)
            {
                var framesForSmoothing = raw.TakeLast(NumFramesSmoothing).Select(point => new Point3(point)).ToList();
                framesForSmoothing.ForEach(p => p.Z *= _depthScale);
                var timestamps = samples.Select(sample => sample.Time).TakeLast(NumFramesSmoothing).ToArray();
                var filtered = _filter is Base2DFilter temporalFilter
                    ? temporalFilter.Process(framesForSmoothing, timestamps)
                    : _filter.Process(framesForSmoothing);
                smooth.Position = new Point3(filtered.Last());
                smooth.Position.Z /= _depthScale;
                if (Math.Sign(smooth.Position.Z) != Math.Sign(track.LastMeasurement.Position.Z))
                    smooth.Position.Z = track.LastMeasurement.Position.Z;
            }

            return smooth;
        }



        /// <summary>
        /// Greedy one-to-one assignment, ordered by distance to the forecast at this frame.
        /// A candidate and a track may each participate in only one pair. Unmatched candidates
        /// start new tracks; unmatched tracks may bridge the configured elapsed time.
        /// With prediction disabled or insufficient samples, falls back to the last measurement.
        /// </summary>
        private List<Interaction> MapClosestInteraction(List<Interaction> candidates)
        {
            // Expire before association, including updates after an interval with no processed frames.
            foreach (var id in _tracks.Where(pair =>
                         _timestampSeconds.Value > pair.Value.LastSeenTime + ContactRetentionSeconds)
                     .Select(pair => pair.Key).ToArray())
                _tracks.Remove(id);

            foreach (var candidate in candidates)
                candidate.TouchId = -1;

            foreach (var track in _tracks.Values)
                track.MatchingPosition = Predict(track, _timestampSeconds.Value);

            var pairs = candidates.SelectMany((candidate, index) => _tracks.Select(track => new
                {
                    CandidateIndex = index,
                    TouchId = track.Key,
                    Distance = Point3.Squared2DDistance(candidate.Position, track.Value.MatchingPosition)
                }))
                .Where(pair => pair.Distance < TouchMergeDistance2D)
                .OrderBy(pair => pair.Distance)
                .ThenBy(pair => pair.TouchId)
                .ThenBy(pair => candidates[pair.CandidateIndex].Position.X)
                .ThenBy(pair => candidates[pair.CandidateIndex].Position.Y)
                .ThenBy(pair => pair.CandidateIndex).ToList();

            var assignedTracks = new HashSet<int>();
            foreach (var pair in pairs)
            {
                var candidate = candidates[pair.CandidateIndex];
                if (candidate.TouchId >= 0 || !assignedTracks.Add(pair.TouchId))
                    continue;
                candidate.TouchId = pair.TouchId;
                candidate.TrackingState = InteractionTrackingState.Confirmed;
                var track = _tracks[pair.TouchId];
                // Continue decay through the last lost interval before recovering. A new detection
                // gains confidence only over continuously observed intervals, never over a lost interval.
                if (track.LastSeenFrame < _frameId - 1)
                    DecayConfidence(track, _timestampSeconds.Value);
                var gain = track.LastSeenFrame == _frameId - 1
                    ? ConfidenceGainPerSecond * (_timestampSeconds.Value - track.LastSeenTime) : 0;
                candidate.Confidence = (float)Math.Min(track.Confidence + gain, Math.Max(0, MaxConfidence));
            }

            foreach (var candidate in candidates)
            {
                if (candidate.TouchId < 0)
                {
                    AssignMaxId(candidate);
                    candidate.TrackingState = InteractionTrackingState.Tentative;
                    candidate.Confidence = Math.Clamp(candidate.Confidence, 0, Math.Max(0, MaxConfidence));
                }
                var matchingPosition = _tracks.TryGetValue(candidate.TouchId, out var previous)
                    ? previous.MatchingPosition : candidate.Position;
                var current = previous ?? new Track();
                if (previous != null && previous.LastMeasurement.Type != candidate.Type)
                    current.Butterworth = null;
                current.LastMeasurement = candidate;
                current.LastSeenFrame = _frameId;
                current.LastSeenTime = _timestampSeconds.Value;
                current.Confidence = candidate.Confidence;
                current.ConfidenceUpdatedAt = _timestampSeconds.Value;
                current.MatchingPosition = (Point3)matchingPosition.Copy();
                current.Samples.Add((_timestampSeconds.Value, new Interaction(candidate)));
                var capacity = Math.Max(1, Math.Max(NumFramesSmoothing, NumFramesForPrediction));
                if (current.Samples.Count > capacity)
                    current.Samples.RemoveRange(0, current.Samples.Count - capacity);
                _tracks[candidate.TouchId] = current;
            }
            return candidates.OrderBy(candidate => candidate.TouchId).ToList();
        }

        private void DecayConfidence(Track track, double timestampSeconds)
        {
            track.Confidence = Math.Max(0, track.Confidence - (float)(ConfidenceDecayPerSecond *
                (timestampSeconds - track.ConfidenceUpdatedAt)));
            track.ConfidenceUpdatedAt = timestampSeconds;
        }

        private (Point3 Velocity, Point3 Acceleration, int Count) EstimateMotion(Track track)
        {
            var samples = track.Samples.TakeLast(NumFramesForPrediction)
                .Select(sample => (sample.Time, Position: sample.Measurement.Position)).ToArray();
            if (samples.Length < 2)
                return (new Point3(), new Point3(), samples.Length);

            // Center times at the newest measurement: the fitted linear coefficient is v(now),
            // not the average velocity half-way between measurements. Gaps retain their duration.
            var span = track.LastSeenTime - samples[0].Time;
            // Normalize the independent variable for well-conditioned fits, then recover derivatives per second.
            var times = samples.Select(sample => (sample.Time - track.LastSeenTime) / span).ToArray();
            var order = UseSecondDerivation && samples.Length >= 3 ? 2 : 1;
            var x = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.X).ToArray(), order);
            var y = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.Y).ToArray(), order);
            var z = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.Z).ToArray(), order);
            var velocity = new Point3((float)(x[1]/span), (float)(y[1]/span), (float)(z[1]/span));
            var acceleration = order == 2 ? new Point3((float)(2*x[2]/(span*span)), (float)(2*y[2]/(span*span)), (float)(2*z[2]/(span*span))) : new Point3();
            return (velocity, acceleration, samples.Length);
        }

        private Point3 Predict(Track track, double targetTime)
        {
            if (!UseVelocityForMapping)
                return (Point3)track.LastMeasurement.Position.Copy();
            var motion = EstimateMotion(track);
            var forecast = new InteractionVelocity();
            forecast.Update(track.LastMeasurement.Position, motion.Velocity, motion.Acceleration,
                SecondDerivationMagnitude, (float)(targetTime - track.LastSeenTime));
            return UseSecondDerivation ? forecast.PredictedPositionAdvanced : forecast.PredictedPositionBasic;
        }

        /// <summary>
        /// Atomic diagnostics for this output frame. Positions use the uncalibrated sensor raster;
        /// forecasts have an explicit time horizon, matching positions were used at this frame timestamp.
        /// Never combines asynchronously delivered interaction/velocity messages in the frontend.
        /// </summary>
        public List<InteractionVelocity> GetVelocities(InteractionFrame output)
        {
            var result = new List<InteractionVelocity>();
            if (!UseVelocityForMapping)
                return result;
            foreach (var interaction in output.Interactions)
            {
                if (!_tracks.TryGetValue(interaction.TouchId, out var track))
                    continue;
                var motion = EstimateMotion(track);
                var item = new InteractionVelocity();
                item.Update(track.LastMeasurement.Position, motion.Velocity, motion.Acceleration,
                    SecondDerivationMagnitude, (float)(output.TimestampSeconds + PredictionHorizonSeconds - track.LastSeenTime));
                item.TouchId = interaction.TouchId;
                item.FrameId = _frameId;
                item.LastMeasuredFrameId = track.LastSeenFrame;
                item.TimestampSeconds = output.TimestampSeconds;
                item.LastMeasuredTimestampSeconds = track.LastSeenTime;
                item.PredictionTimestampSeconds = output.TimestampSeconds + PredictionHorizonSeconds;
                item.PredictionHorizonSeconds = PredictionHorizonSeconds;
                item.Confidence = interaction.Confidence;
                item.SampleCount = motion.Count;
                item.IsPredicted = interaction.TrackingState == InteractionTrackingState.Lost;
                item.UseSecondDerivation = UseSecondDerivation;
                item.SmoothedPosition = (Point3)interaction.Position.Copy();
                item.MatchingPosition = !item.IsPredicted
                    ? (Point3)track.MatchingPosition.Copy() : Predict(track, output.TimestampSeconds);
                result.Add(item);
            }
            return result;
        }

        /// <summary>
        /// Assigns a new id to the given point and increments current maximum touch id.
        /// </summary>
        /// <param name="interaction">the touch point which should get a new unique id</param>
        private void AssignMaxId(Interaction interaction)
        {
            interaction.TouchId = _maxTouchId;
            _maxTouchId++;
        }

    }
}
