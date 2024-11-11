using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Util;

namespace Implementation.Interfaces
{
    public interface IInteractionManager
    {
        ObserverType Type { get; set; }

        IList<Interaction> Interactions { get; }

        float Distance { get; set; }

        float MinDistance { get; set; }

        float MaxDistance { get; set; }

        float MinAngle { get; set; }

        int MinConfidence { get; set; }

        int MaxConfidence { get; set; }

        float InputDistance { get; set; } // @todo könnte int sein

        int InteractionHistorySize { get; set; }

        int NumSmoothingFrames { get; set; }

        int MaxNumEmptyFramesBetween { get; set; }

        float TouchMergeDistance2D { get; set; }

        float DepthScale { get; set; }

       int ExtremumTypeCheckNumSamples { get; set; }

        int ExtremumTypeCheckRadius{ get; set; }

        float ExtremumTypeCheckFittingPercentage{ get; set; }

        ExtremumTypeCheckMethod ExtremumTypeCheckMethod{ get; set; }

        bool UseVelocityPrediction { get; set; }

        int NumFramesForPrediction { get; set; }

        bool UseSecondDerivation  { get; set; }

        float SecondDerivationMagnitude { get; set; }

        FilterType FilterType { get; set; }

        void Init(ObserverType type);

        Task<ProcessServiceStatus> Update();

        float ComputeZeroPlaneDistance();

        event EventHandler<IList<Interaction>> InteractionsUpdated;

        event EventHandler<IList<InteractionVelocity>> VelocitiesUpdated;

        event EventHandler<IList<InteractionFrame>> InteractionHistoryUpdated;
    }
}
