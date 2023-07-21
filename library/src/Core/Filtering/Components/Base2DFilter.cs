using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public abstract class Base2DFilter : IPointFilter 
    {
        
        protected double[] XData { get; private set; }
             
        protected double[] YData { get; private set; }
             
        protected double[] ZData { get; private set; }
        
        protected double[] Ticks { get; private set; }
        
        
        protected double[] PolyX { get; set;}
        
        protected double[] PolyY { get; set;}
        
        protected double[] PolyZ { get; set; }

        
        protected int NumSamplesMin;

        protected Base2DFilter(int numSamplesMin)
        {
            NumSamplesMin = numSamplesMin;
        }


        public List<Point3> Process(List<Point3> samples)
        {
            
            if (samples == null || samples.Count < NumSamplesMin)
                return samples;

            // todo: could be scaled by time interval between frames?
            Ticks = samples.Select((p, index) => (double) index).ToArray();
            
            XData = samples.Select(p => (double) p.X).ToArray();
            YData = samples.Select(p => (double) p.Y).ToArray();
            ZData = samples.Select(p => (double) p.Z).ToArray();
    
            ComputeFit();
            
            var result = new List<Point3>();

            for (var i = 0; i < samples.Count; i++)
            {
                var p = Evaluate(i);
                result.Add(p);
            }

            return result;
        }

        /// <summary>
        /// the evaluation of the generated polynomial at the given index
        /// </summary>
        /// <param name="index"></param>
        /// <returns>smoothed point</returns>
        protected abstract Point3 Evaluate(int index);

        /// <summary>
        /// specifies the algorithm for point fitting, fills PolyX / PolyY / polyZ
        /// </summary>
        /// <param name="order">order of the fitting polynomial</param>
        protected abstract void ComputeFit();
        
    }
}

