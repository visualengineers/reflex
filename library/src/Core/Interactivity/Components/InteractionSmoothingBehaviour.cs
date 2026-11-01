using System;
using System.Collections.Generic;
using System.Linq;
using NLog;
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
            public int LastSeenFrame { get; set; }
            public Point3 MatchingPosition { get; set; }
        }

        private readonly Dictionary<int, Track> _tracks = new();
        private int _numFramesHistory;
        private int _numFramesSmoothing;
        private int _numFramesForPrediction = 3;
        private float _secondDerivationMagnitude = .5f;
        private int _maxNumEmptyFramesBetween;

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
                MaxNumEmptyFramesBetween = _maxNumEmptyFramesBetween;
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
                _numFramesSmoothing = Math.Clamp(value, 0, NumFramesHistory);
                UpdateFilterType(_type);
            }
        }

        /// <summary>Number of consecutive missing measurements tolerated before a track ends.</summary>
        public int MaxNumEmptyFramesBetween
        {
            get => _maxNumEmptyFramesBetween;
            set => _maxNumEmptyFramesBetween = Math.Clamp(value, 0, Math.Max(0, NumFramesHistory - 1));
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
                frame.Interactions.Select(interaction => new Interaction(interaction)).ToList())).ToArray();

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
            _maxTouchId = 0;
            _interactionFrames.Clear();
            _tracks.Clear();
        }

        public void UpdateFilterType(FilterType type)
        {
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

        public InteractionFrame Update(IList<Interaction> rawInteractions)
        {
            _frameId++;

            // Only internal copies are assigned IDs or retained in the tracking history.
            var candidates = rawInteractions.Take(20).Select(item => new Interaction(item)).ToList();
            var mappedInteractionIds = MapClosestInteraction(candidates);
            var newFrame = new InteractionFrame(_frameId, mappedInteractionIds);

            // With history disabled, still publish current measurements, using fresh IDs each frame.
            if (NumFramesHistory == 0)
            {
                _tracks.Clear();
                return newFrame;
            }

            _interactionFrames.Add(newFrame);
            UpdateInteractionFramesList();
            var result = new InteractionFrame(_frameId);
            foreach (var pair in _tracks.OrderBy(pair => pair.Key).ToArray())
            {
                var missingFrames = _frameId - pair.Value.LastSeenFrame;
                if (missingFrames > MaxNumEmptyFramesBetween)
                {
                    // Ended tracks are removed permanently, even while their measurements remain cached.
                    _tracks.Remove(pair.Key);
                    continue;
                }

                var smoothed = SmoothInteraction(pair.Key);
                if (smoothed == null)
                    continue;
                if (missingFrames > 0)
                    smoothed.TrackingState = InteractionTrackingState.Lost;
                result.Interactions.Add(smoothed);
            }

            return result;
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
            var interactionsHistory = new List<Interaction>();

            var frames = new List<InteractionFrame>(_interactionFrames.OrderBy(frame => frame.FrameId));

            frames.ForEach(frame =>
            {
                var lastTouch =
                    frame.Interactions.FirstOrDefault(interaction => Equals(interaction.TouchId, touchId));
                if (lastTouch == null)
                    return;

                interactionsHistory.Add(new Interaction(lastTouch));
            });

            var smooth = interactionsHistory.LastOrDefault();

            var raw = interactionsHistory.Select(interaction => interaction.Position).ToList();

            if (NumFramesSmoothing > 0 &&
                smooth != null && raw.Count >= NumFramesSmoothing &&
                _type != FilterType.None && _filter != null)
            {
                var framesForSmoothing = raw.TakeLast(NumFramesSmoothing).Select(point => new Point3(point)).ToList();
                framesForSmoothing.ForEach(p => p.Z *= _depthScale);
                smooth.Position = new Point3(_filter.Process(framesForSmoothing).Last());
                smooth.Position.Z /= _depthScale;
            }

            return smooth;
        }



        /// <summary>
        /// Greedy one-to-one assignment, ordered by distance to the forecast at this frame.
        /// A candidate and a track may each participate in only one pair. Unmatched candidates
        /// start new tracks; unmatched tracks may bridge the configured number of empty frames.
        /// With prediction disabled or insufficient samples, falls back to the last measurement.
        /// </summary>
        private List<Interaction> MapClosestInteraction(List<Interaction> candidates)
        {
            // The current frame may contain a measurement, so only preceding empty frames count here.
            foreach (var id in _tracks.Where(pair =>
                         _frameId - pair.Value.LastSeenFrame - 1 > MaxNumEmptyFramesBetween)
                     .Select(pair => pair.Key).ToArray())
                _tracks.Remove(id);

            foreach (var candidate in candidates)
                candidate.TouchId = -1;

            foreach (var track in _tracks.Values)
                track.MatchingPosition = Predict(track, _frameId);

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
                candidate.Confidence = Math.Min(Math.Max(candidate.Confidence,
                    _tracks[pair.TouchId].LastMeasurement.Confidence) + 1, MaxConfidence);
            }

            foreach (var candidate in candidates)
            {
                if (candidate.TouchId < 0)
                {
                    AssignMaxId(candidate);
                    candidate.TrackingState = InteractionTrackingState.Tentative;
                }
                var matchingPosition = _tracks.TryGetValue(candidate.TouchId, out var previous)
                    ? previous.MatchingPosition : candidate.Position;
                _tracks[candidate.TouchId] = new Track
                {
                    LastMeasurement = candidate,
                    LastSeenFrame = _frameId,
                    MatchingPosition = (Point3)matchingPosition.Copy()
                };
            }
            return candidates.OrderBy(candidate => candidate.TouchId).ToList();
        }

        private (Point3 Velocity, Point3 Acceleration, int Count) EstimateMotion(Track track)
        {
            var samples = _interactionFrames.OrderBy(frame => frame.FrameId)
                .SelectMany(frame => frame.Interactions.Where(i => i.TouchId == track.LastMeasurement.TouchId)
                    .Select(i => (Frame: frame.FrameId, Position: i.Position)))
                .TakeLast(NumFramesForPrediction).ToArray();
            if (samples.Length < 2)
                return (new Point3(), new Point3(), samples.Length);

            // Center times at the newest measurement: the fitted linear coefficient is v(now),
            // not the average velocity half-way between measurements. Gaps retain their duration.
            var times = samples.Select(sample => (double)(sample.Frame - track.LastSeenFrame)).ToArray();
            var order = UseSecondDerivation && samples.Length >= 3 ? 2 : 1;
            var x = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.X).ToArray(), order);
            var y = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.Y).ToArray(), order);
            var z = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.Z).ToArray(), order);
            var velocity = new Point3((float)x[1], (float)y[1], (float)z[1]);
            var acceleration = order == 2 ? new Point3((float)(2*x[2]), (float)(2*y[2]), (float)(2*z[2])) : new Point3();
            return (velocity, acceleration, samples.Length);
        }

        private Point3 Predict(Track track, int targetFrame)
        {
            if (!UseVelocityForMapping)
                return (Point3)track.LastMeasurement.Position.Copy();
            var motion = EstimateMotion(track);
            var forecast = new InteractionVelocity();
            forecast.Update(track.LastMeasurement.Position, motion.Velocity, motion.Acceleration,
                SecondDerivationMagnitude, targetFrame - track.LastSeenFrame);
            return UseSecondDerivation ? forecast.PredictedPositionAdvanced : forecast.PredictedPositionBasic;
        }

        /// <summary>
        /// Atomic diagnostics for this output frame. Positions use the uncalibrated sensor raster;
        /// forecasts are for the NEXT processed frame, matching positions were used for THIS frame.
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
                    SecondDerivationMagnitude, _frameId + 1 - track.LastSeenFrame);
                item.TouchId = interaction.TouchId;
                item.FrameId = _frameId;
                item.LastMeasuredFrameId = track.LastSeenFrame;
                item.PredictionFrameId = _frameId + 1;
                item.SampleCount = motion.Count;
                item.IsPredicted = track.LastSeenFrame != _frameId;
                item.UseSecondDerivation = UseSecondDerivation;
                item.SmoothedPosition = (Point3)interaction.Position.Copy();
                item.MatchingPosition = track.LastSeenFrame == _frameId
                    ? (Point3)track.MatchingPosition.Copy() : Predict(track, _frameId);
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
