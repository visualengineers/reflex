using System;
using System.Collections.Generic;
using System.Linq;
using NLog;
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
        }

        private readonly Dictionary<int, Track> _tracks = new();
        private int _numFramesHistory;
        private int _numFramesSmoothing;
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
            set => _numFramesSmoothing = Math.Clamp(value, 0, NumFramesHistory);
        }

        /// <summary>Number of consecutive missing measurements tolerated before a track ends.</summary>
        public int MaxNumEmptyFramesBetween
        {
            get => _maxNumEmptyFramesBetween;
            set => _maxNumEmptyFramesBetween = Math.Clamp(value, 0, Math.Max(0, NumFramesHistory - 1));
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
                    _filter = new SimpleMovingAverageFilter(Math.Max(1, NumFramesHistory / 2));
                    break;
                case FilterType.WeightedMovingAverage:
                    _filter = new WeightedMovingAverageFilter(Math.Max(1, NumFramesHistory / 2));
                    break;
                case FilterType.PolynomialFit:
                    _filter = new PolynomialFitFilter();
                    break;
                case FilterType.WeightedPolynomialFit:
                    _filter = new WeightedPolynomialFitFilter();
                    break;
                case FilterType.SavitzkyGolay:
                {
                    var sidePoints = Math.Max(0, NumFramesHistory / 2 - 1);
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
                var framesForSmoothing = raw.Take(NumFramesSmoothing).Select(point => new Point3(point)).ToList();
                framesForSmoothing.ForEach(p => p.Z *= _depthScale);
                smooth.Position = new Point3(_filter.Process(framesForSmoothing).First());
                smooth.Position.Z /= _depthScale;
            }

            return smooth;
        }



        /// <summary>
        /// Greedy one-to-one assignment, ordered by distance to the latest measurement.
        /// A candidate and a track may each participate in only one pair. Unmatched candidates
        /// start new tracks; unmatched tracks may bridge the configured number of empty frames.
        /// This is proximity tracking, not motion prediction: ambiguous crossings can swap IDs.
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

            var pairs = candidates.SelectMany((candidate, index) => _tracks.Select(track => new
                {
                    CandidateIndex = index,
                    TouchId = track.Key,
                    Distance = Point3.Squared2DDistance(candidate.Position, track.Value.LastMeasurement.Position)
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
                _tracks[candidate.TouchId] = new Track
                {
                    LastMeasurement = candidate,
                    LastSeenFrame = _frameId
                };
            }
            return candidates.OrderBy(candidate => candidate.TouchId).ToList();
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
