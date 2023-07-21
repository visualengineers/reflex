using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// describes the type of the extremum for an <see cref="Interaction"/>
    /// contains the  <see cref="ExtremumType"/> and the percentage of neighbor points that are
    /// closer to the surface / farther away and thus serve as discriminator for the associated type    
    /// </summary>
    public class ExtremumDescription
    {
        /// <summary>
        /// Describing the type of the extremum. Relative to the surface, that means, a maximum is surrounded by points that are closer to the surface.  
        /// </summary>
        public ExtremumType Type { get; set; }
        
        /// <summary>
        /// The type of the Extremum is computed by checking the Z-position of neighboring points. This value describes,
        /// how many points are in the correct depth range (closer to the surface for a maximum, farther away for a minimum). 
        /// </summary>
        public int NumFittingPoints { get; set; }
        
        /// <summary>
        /// The type of the Extremum is computed by checking the Z-position of neighboring points. This value describes
        /// the percentage of points that are in the correct depth range (closer to the surface for a maximum, farther away for a minimum). 
        /// </summary>
        public float PercentageFittingPoints { get; set; }
    }
}