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

        protected override Task<ProcessingResult> CheckInitialState()
        {
          return Task.FromResult(PointCloud == null
            ? new ProcessingResult(ProcessServiceStatus.Error)
            : new ProcessingResult(ProcessServiceStatus.Available)
          );
        }


        protected override Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(
          ProcessPerformance performance)
        {
          var extreme = FindGlobalExtreme(PointCloud, Distance);
          var result = new List<Interaction>() { new Interaction(extreme, InteractionType.None, 1) };
          var perfItem = new ProcessPerformance();
          perfItem.Preparation = TimeSpan.Zero;

          return Task.FromResult(new Tuple<IEnumerable<Interaction>, ProcessPerformance>(result, perfItem));
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
