using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;
using Math = System.Math;

namespace ReFlex.Core.Interactivity.Components
{
    /// <summary>
    /// Observes a depthimage and reports single touch interactions.
    /// </summary>
    /// <seealso cref="IInteractionObserver" />
    /// <inheritdoc />
    /// <seealso cref="T:ReFlex.Core.Interactivity.Interfaces.IInteractionObserver" />
    public class SingleInteractionObserver : InteractionObserverBase
    {
        private readonly Stopwatch _stopWatch = new();

        #region Properties

        /// <summary>
        /// Gets the type.
        /// </summary>
        /// <value>
        /// The type.
        /// </value>
        public override ObserverType Type => ObserverType.SingleTouch;

        /// <summary>
        /// Gets or sets the source.
        /// </summary>
        /// <value>
        /// The source.
        /// </value>
        public override PointCloud3 PointCloud { get; set; }

        /// <inheritdoc />
        /// <summary>
        /// Gets or sets the vector field.
        /// </summary>
        /// <value>
        /// The vector field.
        /// </value>
        public override VectorField2 VectorField { get; set; }

        #endregion

        #region Events

        public override event EventHandler<IList<Interaction>> NewInteractions;

        #endregion

        public override Task<ProcessingResult> Update()
        {
            if (PointCloud == null)
                return Task.FromResult(new ProcessingResult(ProcessServiceStatus.Error));

            var processResult = new ProcessingResult(ProcessServiceStatus.Available);
            var perfItem = new ProcessPerformance();

            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }
            var extreme = FindGlobalExtreme(PointCloud, Distance);
            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.Update = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            float depth;
            InteractionType type;


            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            var extremumType = ComputeExtremumType(PointCloud.AsJaggedArray(), (int) extreme.X, (int) extreme.Y);

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

            if (extreme.Z < Distance + MinDistance && extreme.Z > Distance - MinDistance)
            {
                type = InteractionType.None;
                depth = 0;
            }
            else if (extreme.Z < Distance)
            {
                type = InteractionType.Push;
                depth = (Distance - extreme.Z - MinDistance) / (MinDistance - MaxDistance);

                if (depth > 0)
                    depth = 0;

                if (depth < -1)
                    depth = -1;
            }
            else
            {
                type = InteractionType.Pull;
                depth = (extreme.Z - MinDistance - Distance) / (MaxDistance - MinDistance);

                if (depth < 0)
                    depth = 0;

                if (depth > 1)
                    depth = 1;
            }

            extreme.Z = depth;

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

            var TOLERANCE = 0.001;

            var result = new List<Interaction>();

            if (Math.Abs(depth) > TOLERANCE)
            {
                var interaction = new Interaction(extreme, type, 1);
                interaction.ExtremumDescription = extremumType;

                var frame = ComputeSmoothingValue(interaction.AsList());

                var smoothed = frame.Interactions;

                if (smoothed.Count > 0)
                {
                    result = smoothed.Take(1).ToList();

                    var lastTime = smoothed.Max(item => item.Time);
                    var id = smoothed.Max(item => item.TouchId);
                    var last = smoothed.FirstOrDefault(
                        it => Equals(it.Time, lastTime) && Equals(it.TouchId, id));

                    if (last != null)
                    {
                        var smoothedItem = new Interaction(last)
                        {
                            TouchId = id
                        };

                        result = new List<Interaction> { smoothedItem };
                    }
                }
                else
                {
                    result = smoothed;
                }
            }

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.Smoothing = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            UpdatePerformanceMetrics(perfItem);

            NewInteractions?.Invoke(this, result);

            return Task.FromResult(processResult);
        }

        /// <summary>
        /// Finds the global extreme.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <param name="averageDepth">The average depth.</param>
        /// <returns></returns>
        public static Point3 FindGlobalExtreme(PointCloud3 source, float averageDepth)
        {
            var candidate = new Point3(0, 0, averageDepth);

            if (source == null)
                return candidate;

            var candidates = source.AsJaggedArray();

            for (var x = 0; x < source.SizeX; ++x)
            {
                for (var y = 0; y < source.SizeY; ++y)
                {
                    var curr = candidates[x][y];

                    if (!curr.IsValid)
                        continue;

                    if (!(Math.Abs(curr.Z - averageDepth)
                          >= Math.Abs(candidate.Z - averageDepth)))
                        continue;

                    candidate.X = x;
                    candidate.Y = y;
                    candidate.Z = candidates[x][y].Z;
                }
            }

            return candidate;
        }
    }

}
