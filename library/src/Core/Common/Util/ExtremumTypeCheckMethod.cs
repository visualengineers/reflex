namespace ReFlex.Core.Common.Util
{
    /// <summary>
    /// Enum to describe how to determine the extremum type
    /// <see cref="Global"/>: basically disable the check in case of a single global extremum
    /// this will automatically be a (relative) maximum
    /// <see cref="FixedRadius"/>: check a predefined number of positions in a given radius
    /// <see cref="StochasticStatic"/>: check random positions (determined on program start) in a given radius
    /// <see cref="StochasticDynamic"/>: check random positions (determined for each frame on each extremum) in a given radius  
    /// </summary>
    public enum ExtremumTypeCheckMethod
    {
        Global,
        FixedRadius,
        StochasticStatic,
        StochasticDynamic
    }
}