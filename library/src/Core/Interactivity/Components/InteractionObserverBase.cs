using System;
using System.Collections.Generic;
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

        private readonly InteractionSmoothingBehaviour _smoothingBehaviour;
        private int _numSmoothingFrames = 5;
        private int _historySize = 25;
        private int _maxNumEmptyFramesBetween = 3;
        private float _touchMergeDistance2d = 64f;
        private float _depthScale = 100.0f;
        private FilterType _filterType;
        private float _maxConfidence;
        private int _extremumTypeCheckRadius;
        private int _extremumTypeCheckNumSamples;

        private Tuple<int, int>[] _fixedSamples = Array.Empty<Tuple<int, int>>();
        private Tuple<int, int>[] _stochasticSamples = Array.Empty<Tuple<int, int>>();
        private bool _useVelocityPrediction = true;
        private bool _useSecondDerivation = false;

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

        public bool UseVelocityPrediction
        {
            get => _useVelocityPrediction;
            set
            {
                _useVelocityPrediction = value;
                if (_smoothingBehaviour != null)
                {
                    _smoothingBehaviour.UseVelocityForMapping = value;
                }
            }
        }

        public int NumFramesForPrediction { get; set; } = 2;

        public bool UseSecondDerivation
        {
            get => _useSecondDerivation;
            set
            {
                _useSecondDerivation = value;
                if (_smoothingBehaviour != null)
                {
                    _smoothingBehaviour.UseSecondDerivation = value;
                }
            }
        }

        public float SecondDerivationMagnitude { get; set; } = 0.5f;

        public int InteractionHistorySize
        {
            get => _historySize;
            set
            {
                _historySize = value;
                if (_smoothingBehaviour != null)
                {
                    _smoothingBehaviour.NumFramesHistory = value;
                    // update depending smoothing/filter values
                    NumSmoothingFrames = _numSmoothingFrames;
                    MaxNumEmptyFramesBetween = _maxNumEmptyFramesBetween;
                }
            }
        }

        public int NumSmoothingFrames
        {
            get => _numSmoothingFrames;
            set
            {
                _numSmoothingFrames = value;
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.NumFramesSmoothing = value < _smoothingBehaviour.NumFramesHistory
                        ? _smoothingBehaviour.NumFramesHistory
                        : value;
            }
        }

        // TODO: write tests for negative (!) values and values larger than history
        public int MaxNumEmptyFramesBetween
        {
            get => _maxNumEmptyFramesBetween;
            set
            {
                _maxNumEmptyFramesBetween = value;
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.MaxNumEmptyFramesBetween = value < _smoothingBehaviour.NumFramesHistory
                        ? _smoothingBehaviour.NumFramesHistory
                        : value;
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
                _depthScale = value;
                if (_smoothingBehaviour != null)
                    _smoothingBehaviour.DepthScale = value;
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

        public abstract event EventHandler<InteractionData> NewInteractions;

        public event EventHandler<PerformanceDataItem> PerformanceDataUpdated;

        public event EventHandler<IList<InteractionFrame>> InteractionHistoryUpdated;

        public abstract Task<ProcessingResult> Update();

        #endregion

        #region Constructor

        protected InteractionObserverBase()
        {
            _smoothingBehaviour = new InteractionSmoothingBehaviour(InteractionHistorySize);
        }

        #endregion

        public void UpdateFrameId(int frameId)
        {
            FrameId = frameId;
        }

        #endregion

        protected InteractionFrame ComputeSmoothingValue(IList<Interaction> rawInteractions)
        {
            var result = _smoothingBehaviour.Update(rawInteractions);
            InteractionHistoryUpdated?.Invoke(this, _smoothingBehaviour.InteractionsFramesCache);

            return result;
        }

        protected virtual ExtremumDescription ComputeExtremumType(Point3[][] pointsArray, int xPos, int yPos)
        {
            if (ExtremumTypeCheckMethod == ExtremumTypeCheckMethod.Global)
                return new ExtremumDescription
                    { Type = ExtremumType.Maximum, NumFittingPoints = ExtremumTypeCheckNumSamples, PercentageFittingPoints = 1.0f };

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
                if (item == null)
                    continue;

                if (item.Position.Z < Distance)
                {
                    var depth = (Distance - item.Position.Z - MinDistance) / (MinDistance - MaxDistance);

                    if (depth > 0)
                        continue;

                    if (depth < -1)
                        depth = -1;

                    item.Position.Z = depth;
                }
                else
                {
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

        protected void UpdatePerformanceMetrics(ProcessPerformance perfItem)
        {
            var pData = new PerformanceDataItem
            {
                FrameId = Convert.ToInt32(FrameId),
                FrameStart = DateTime.Now.Ticks,
                Process = perfItem,
                Stage = PerformanceDataStage.ProcessingData
            };

            PerformanceDataUpdated?.Invoke(this, pData);
        }

        protected new List<InteractionVelocity> ComputeVelocities(InteractionFrame frame)
        {
            var result = new List<InteractionVelocity>();

            if (!UseVelocityPrediction)
                return result;

            var interactionFrames = _smoothingBehaviour.InteractionsFramesCache;

            foreach (var interaction in frame.Interactions)
            {
                var interactionsBefore = interactionFrames
                    .OrderByDescending((f) => f.FrameId)
                    .Take(NumFramesForPrediction * 2)
                    .SelectMany((f) => f.Interactions.Where((i) => Equals(i.TouchId, interaction.TouchId) ) )
                    .Skip(NumFramesForPrediction)
                    .ToList();
                if (interactionsBefore.Count == 0)
                {
                    result.Add(new InteractionVelocity(interaction.TouchId, interaction.Position));
                    break;
                }

                var firstDerivation = new Point3(interactionsBefore[0].Position.X -interaction.Position.X, interactionsBefore[0].Position.Y - interaction.Position.Y, interactionsBefore[0].Position.Z - interaction.Position.Z);
                var secondDerivation = interactionsBefore.Count < NumFramesForPrediction + 1
                    ? firstDerivation
                    : new Point3(
                        (interactionsBefore[0].Position.X - interactionsBefore[NumFramesForPrediction].Position.X) - firstDerivation.X,
                        (interactionsBefore[0].Position.Y - interactionsBefore[NumFramesForPrediction].Position.Y) - firstDerivation.Y,
                        (interactionsBefore[0].Position.Z - interactionsBefore[NumFramesForPrediction].Position.Z) - firstDerivation.Z);

                result.Add(new InteractionVelocity(interaction.TouchId, interaction.Position, firstDerivation,secondDerivation, SecondDerivationMagnitude));
            }

            _smoothingBehaviour.UpdateVelocities(result);

            return result;
        }

        protected void UpdateInteractionFrames(List<Interaction> cleanedUpInteractions, InteractionFrame currentFrame)
        {
          currentFrame.Interactions.ForEach((interaction) =>
          {
            if (cleanedUpInteractions.FirstOrDefault((i) => i.TouchId == interaction.TouchId) == null)
            {
              if (interaction.Confidence > 0)
                interaction.Confidence--;
            }
          });

          currentFrame.Interactions.RemoveAll((interaction) => interaction.Confidence <= 0);

          _smoothingBehaviour.UpdateCachedFrame(currentFrame);
          InteractionHistoryUpdated?.Invoke(this, _smoothingBehaviour.InteractionsFramesCache);
        }

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

                result.Add(new Tuple<int, int>(xStochastic, yStochastic));
            }

            return result.ToArray();
        }

        private void UpdateSamples()
        {
            var samplesFixed = new List<Tuple<int, int>>();

            for (var i = 0; i < ExtremumTypeCheckNumSamples; i++)
            {
                var p = (float)i / ExtremumTypeCheckRadius;
                var xFixed = (int) Math.Floor(ExtremumTypeCheckRadius * Math.Cos(p * 2 * Math.PI));
                var yFixed = (int) Math.Floor(ExtremumTypeCheckRadius * Math.Sin(p * 2 * Math.PI));

                samplesFixed.Add(new Tuple<int, int>(xFixed, yFixed));
            }
            _fixedSamples = samplesFixed.ToArray();

            _stochasticSamples = GenerateSamples();
        }
    }
}
