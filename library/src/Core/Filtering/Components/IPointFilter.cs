using System.Collections.Generic;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public interface IPointFilter
    {
        List<Point3> Process(List<Point3> samples);
        
    }
}