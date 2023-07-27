using System;
using System.Collections.Generic;
using System.Linq;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Filtering.Components;
using ReFlex.Core.Interactivity.Util;

namespace ReFlex.Core.Interactivity.Components
{
    public class InteractionSmoothingBehaviour
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        
        #region Fields
        
        private List<InteractionFrame> _interactionFrames = new List<InteractionFrame>();
        
        private int _frameId = 0;
        private int _maxTouchId = 0;
        private FilterType _type = FilterType.None;
        private IPointFilter _filter;

        private float _depthScale = 500f;

        #endregion

        #region Properties
        
        public float TouchMergeDistance2D { get; set; } = 64f;
        
        public  int NumFramesHistory { get; set; }
        
        public  int NumFramesSmoothing { get; set; }

        public int MaxNumEmptyFramesBetween { get; set; }

        public int CurrentFrameId => _frameId;
        public int CurrentMaxId => _maxTouchId;
        
        public int MaxConfidence { get; set; }

        public float DepthScale
        {
            get => _depthScale;
            set => _depthScale = value;
        }

        public InteractionFrame[] InteractionsFramesCache => _interactionFrames.ToArray();
        
        #endregion
        
        #region Constructor

        public InteractionSmoothingBehaviour(int numFramesHistory)
        {
            NumFramesHistory = numFramesHistory;
            _filter = new SimpleMovingAverageFilter((int) Math.Floor(NumFramesHistory / 2d));
        }
        
        #endregion
        
        #region public Methods

        public void Reset()
        {
            _frameId = 0;
            _maxTouchId = 0;
            _interactionFrames.Clear();
        }

        public void UpdateFilterType(FilterType type)
        {
            _type = type;

            switch (type)
            {
                case FilterType.MovingAverage:
                    _filter = new SimpleMovingAverageFilter((int) Math.Floor(NumFramesHistory / 2d));
                    break;
                case FilterType.WeightedMovingAverage:
                    _filter = new WeightedMovingAverageFilter((int) Math.Floor(NumFramesHistory / 2d));
                    break;
                case FilterType.PolynomialFit:
                    _filter = new PolynomialFitFilter();
                    break;
                case FilterType.WeightedPolynomialFit:
                    _filter = new WeightedPolynomialFitFilter();
                    break;
                case FilterType.SavitzkyGolay:
                {
                    var sidePoints = NumFramesHistory / 2 - 1;
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

            // reconstruct ids by mapping touches in history 
            var mappedInteractionIds = MapClosestInteraction(rawInteractions.Take(20).ToList());
            
            // store raw interactions with associated ids
            var newFrame = new InteractionFrame(_frameId, mappedInteractionIds);
            
            _interactionFrames.Add(newFrame);
            
            // remove old entries / update when _numFrames has changed
            UpdateInteractionFramesList();

            // create new Frame for smoothed values
            var result = new InteractionFrame(_frameId);
            
            var frames = _interactionFrames.ToArray();
                
            var allInteractionIds = frames
                .SelectMany(frame => frame.Interactions.Select(interaction => interaction.TouchId)).Distinct().ToList();
            
            allInteractionIds.ForEach(id =>
            {
                var lastFrameId = frames.OrderByDescending(frame => frame.FrameId).FirstOrDefault(frame =>
                        frame.Interactions.FirstOrDefault(interaction => Equals(interaction.TouchId, id)) != null)
                    ?.FrameId ?? -1;

                // remove touch ids that are "too old" --> prevent touch from being still displayed after the finger left the table
                // if touch id "returns" after a while, do not filter it out
                if (_frameId - lastFrameId > MaxNumEmptyFramesBetween && newFrame.Interactions.FirstOrDefault(interaction => Equals(interaction.TouchId, id)) == null)
                    return;

                var smoothed = SmoothInteraction(id);
                if (smoothed != null)
                    result.Interactions.Add(smoothed);
            });
            

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
                var framesForSmoothing = raw.Take(NumFramesSmoothing).ToList();
                framesForSmoothing.ForEach(p => p.Z *= _depthScale);
                smooth.Position = _filter.Process(framesForSmoothing).First();
                smooth.Position.Z /= _depthScale;
                framesForSmoothing.ForEach(p => p.Z /= _depthScale);
            }

            return smooth;
        }
        
        

        /// <summary>
        /// Try to identify an interaction that can be associated with the given interaction (from another frame, or smoothed ?) in the given frame
        /// returns null, if no interaction can be found which is within the <see cref="TouchMergeDistance2D"/>.
        /// </summary>
        /// <param name="frameToSearch"></param>
        /// <param name="source"></param>
        /// <returns></returns>
        private List<Interaction> MapClosestInteraction(List<Interaction> rawInteractions)
        {
            // no past interactions: assign Ids
            if (_interactionFrames.Count == 0)
            {
                rawInteractions.ForEach(AssignMaxId);
                return rawInteractions;
            }

            // step 1: look in past frames for 

            var pastFrames = _interactionFrames.Where(frame => frame.Interactions.Count > 0).OrderByDescending(frame => frame.FrameId).ToArray();

            var result = new List<Interaction>();

            var candidates = rawInteractions.ToArray();

            var i = pastFrames.Length - 1;

            while (candidates.Length != 0 && i >= 0)
            {
             // List : candidateIdx, Array<touchId, distances> (ordered by distance desc))
                var distances = 
                    candidates.Select((interaction, idx) => Tuple.Create(idx, 
                        pastFrames[i].Interactions
                            .Select(otherInteraction => Tuple.Create(otherInteraction, Point3.Squared2DDistance(interaction.Position, otherInteraction.Position)))
                            .OrderBy(tpl => tpl.Item2)
                            .ToList()))
                        .ToList();

                var duplicateCount = distances.Count;

                while (duplicateCount != 0)
                {
                    // if a point has 
                    // distances.Where(dist => dist.Item2.Count == 0).ToList().ForEach(tpl =>
                    //    {
                    //        var interaction = new Interaction(candidates[tpl.Item1]);
                    //         AssignMaxId(interaction);
                    //         result.Add(interaction);
                    //     }
                    // );
                    // remove all points which have no next point
                    distances.RemoveAll(dist => dist.Item2.Count == 0);

                    var duplicates = distances.Where(dist => dist.Item2.Count != 0).GroupBy(tpl => tpl.Item1).Where(group => group.Count() > 1).ToList();

                    duplicateCount = duplicateCount > 0 ? duplicates.Count : duplicateCount;

                    duplicates.ForEach(
                        duplicate =>
                        {
                            var ordered = duplicate.ToList().OrderBy(elem => elem.Item2[0].Item2).ToList();
                            for (var n = 1; n < ordered.Count; n++)
                            {
                                // remove duplicate distance
                                ordered[n].Item2
                                    .RemoveAt(0);
                            }
                        });
                }
                
                distances.ForEach(dist =>
                {
                    if (dist.Item2[0].Item2 < TouchMergeDistance2D)
                    {
                        var interaction = new Interaction(candidates[dist.Item1]);
                        interaction.TouchId = dist.Item2[0].Item1.TouchId;

                        interaction.Confidence = ComputeConfidence(interaction.TouchId, interaction.Confidence, pastFrames);
                        candidates[dist.Item1].TouchId = dist.Item2[0].Item1.TouchId;

                        // prevent adding duplicate id's
                        var alreadyAdded = result.FirstOrDefault(inter => Equals(inter.TouchId, interaction.TouchId));

                        // id does not exist - add point
                        if (alreadyAdded == null)
                        {
                            result.Add(interaction);
                        }
                        else
                        {
                            // TODO: find better selection of associated point (distance and time)
                            if (alreadyAdded.Confidence > interaction.Confidence)
                            {
                                result.Remove(alreadyAdded);
                                interaction.Confidence = alreadyAdded.Confidence;
                                result.Add(interaction);
                            }                 
                        }
                    }
                });

                candidates = candidates.Where(interaction => interaction.TouchId < 0).ToArray();
                
                i--;
            }
            
            var newInteractions =  candidates.ToList();
            newInteractions.ForEach(AssignMaxId);
            
            result.AddRange(newInteractions);
            
            return result.OrderBy(interaction => interaction.TouchId).ToList();
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

        private int ComputeConfidence(int touchId, float currentConfidence, InteractionFrame[] pastFrames)
        {
            // find maximum confidence in history for touch id
            var maxExistingConfidence = pastFrames.SelectMany(frames => frames.Interactions)
                .Where(inter => Equals(inter.TouchId, touchId)).Max(inter => inter.Confidence);
            
            // increment and clamp to max value
            return (int) Math.Min(Math.Max(currentConfidence, maxExistingConfidence) + 1, MaxConfidence);
        }
    } 
}