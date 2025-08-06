using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Interactivity.Components
{
    public class NoInteractionObserver : InteractionObserverBase
    {
        public override ObserverType Type => ObserverType.None;

        public override PointCloud3 PointCloud { get; set; }
        public override VectorField2 VectorField { get; set; }

        protected override Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
        {
          throw new NotImplementedException($"{GetType().FullName} should NEVER try to {nameof(Analyze)} anything.");
        }

        protected override Task<ProcessingResult> CheckInitialState()
        {
          return Task.FromResult(new ProcessingResult());
        }
    }
}
