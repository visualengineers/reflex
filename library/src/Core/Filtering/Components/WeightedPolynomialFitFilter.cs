using MathNet.Numerics;
using MathNet.Numerics.Distributions;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public class WeightedPolynomialFitFilter : Base2DFilter
    {
        private readonly int _order;

        public WeightedPolynomialFitFilter(int order = 3) : base(order + 1)
        {
            _order = order;
        }
        
        protected override Point3 Evaluate(int index)
        {
            return new Point3(
                (float) Polynomial.Evaluate(index, PolyX), 
                (float) Polynomial.Evaluate(index, PolyY),
                (float) Polynomial.Evaluate(index, PolyZ));
        }

        protected override void ComputeFit()
        {
            var weights = new double[Ticks.Length];
            Normal.Samples(weights, 1, 0);
            
            PolyX = Fit.PolynomialWeighted(Ticks, XData, weights, _order);
            PolyY = Fit.PolynomialWeighted(Ticks, YData, weights,_order);
            PolyZ = Fit.PolynomialWeighted(Ticks, ZData, weights, _order);
        }
    }
}