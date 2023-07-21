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
        public override event EventHandler<IList<Interaction>> NewInteractions;
             
        public override Task<ProcessingResult> Update()
        {
            UpdatePerformanceMetrics(new ProcessPerformance());
            
            return Task.FromResult(new ProcessingResult(ProcessServiceStatus.Error));
        }
    }
}
