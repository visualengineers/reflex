using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Util;

namespace ReFlex.Core.Interactivity.Interfaces
{
    /// <summary>
    /// 
    /// </summary>
    public interface IInteractionObserver
    {
        /// <summary>
        /// Gets the type.
        /// </summary>
        /// <value>
        /// The type.
        /// </value>
        ObserverType Type { get; }

        /// <summary>
        /// Gets or sets the distance.
        /// </summary>
        /// <value>
        /// The distance.
        /// </value>
        float Distance { get; set; }

        /// <summary>
        /// Gets or sets the minimum depth.
        /// </summary>
        /// <value>
        /// The maximum depth.
        /// </value>
        float MinDistance { get; set; }

        /// <summary>
        /// Gets or sets the minimum angle.
        /// </summary>
        /// <value>
        /// The minimum angle.
        /// </value>
        float MinAngle { get; set; }

        /// <summary>
        /// Gets or sets the minimum confidence.
        /// </summary>
        /// <value>
        /// The minimum confidence.
        /// </value>
        float MinConfidence { get; set; }

        /// <summary>
        /// Gets or sets the maximum confidence.
        /// </summary>
        /// <value>
        /// The maximum confidence.
        /// </value>
        float MaxConfidence { get; set; }

        /// <summary>
        /// Gets or sets the maximum depth.
        /// </summary>
        /// <value>
        /// The maximum depth.
        /// </value>
        float MaxDistance { get; set; }
        
        /// <summary>
        /// Number of Frames for tracking movement of touch points. If set to 0, every extremum point gets a unique id (in every frame).
        /// </summary>
        int InteractionHistorySize { get; set; }
        
        /// <summary>
        /// Number of Frames for smoothing. If set to 0, no smoothing is applied.
        /// </summary>
        int NumSmoothingFrames { get; set; }
        
        /// <summary>
        /// Threshold number of frames for displaying interactions from history when no touch is registered
        /// must be smaller than <see cref="InteractionHistorySize"/> 
        /// </summary>
        int MaxNumEmptyFramesBetween { get; set; }
        
        /// <summary>
        /// defines the squared distance to closest points to be recognized as same point
        /// </summary>
        float TouchMergeDistance2D { get; set; }
        
        /// <summary>
        /// defines the squared distance to closest points to be recognized as same point
        /// </summary>
        float DepthScale { get; set; }
        
        /// <summary>
        /// Specifies the Type to be used for smoothing interactions
        /// </summary>
        FilterType FilterType { get; set; }

        /// <summary>
        /// Gets or sets the point cloud.
        /// </summary>
        /// <value>
        /// The point cloud.
        /// </value>
        PointCloud3 PointCloud { get; set; }

        /// <summary>
        /// Gets or sets the vector field.
        /// </summary>
        /// <value>
        /// The vector field.
        /// </value>
        VectorField2 VectorField { get; set; }
        
        /// <summary>
        /// defines how many points should be checked to determine the type of the extremum 
        /// </summary>
        int ExtremumTypeCheckNumSamples { get; set; } 
        
        /// <summary>
        /// The pixel radius in which the points are sampled for deriving the type of the local extremum  
        /// </summary>
        int ExtremumTypeCheckRadius { get; set; }
        
        /// <summary>
        /// Which ratio of "correctly aligned" points should match to distinguish between Undefined or Minimum/Maximum ?
        /// </summary>
        float ExtremumTypeCheckFittingPercentage { get; set; }
        
        /// <summary>
        /// Defines how neighboring the points are sampled for determining the type of extremum.
        /// </summary>
        ExtremumTypeCheckMethod ExtremumTypeCheckMethod { get; set; }

        /// <summary>
        /// Occurs when new interactions are detected.
        /// </summary>
        event EventHandler<IList<Interaction>> NewInteractions;

        /// <summary>
        /// Occurs when interaction history is updated.
        /// </summary>
        event EventHandler<IList<InteractionFrame>> InteractionHistoryUpdated;

        /// <summary>
        /// Updates the observer to generate a new interaction.
        /// </summary>
        Task<ProcessingResult> Update();

        /// <summary>
        /// Calculates the average distance of al valid and not filtered points to
        /// automatically determine the distance of the zero plane 
        /// </summary>
        /// <returns>the average z-depth of the surface provided by the given points</returns>
        float CalculateAverageDistance();
    }
}
