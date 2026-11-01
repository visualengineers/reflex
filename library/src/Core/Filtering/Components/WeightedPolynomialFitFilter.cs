using System;
using MathNet.Numerics;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>Least-squares polynomial fit with deterministic positive weights increasing
    /// linearly from 1 (oldest time) to 2 (newest time).</summary>
    public class WeightedPolynomialFitFilter : Base2DFilter
    {
        private readonly int _order;

        public WeightedPolynomialFitFilter(int order = 3) : base(order >= 0 && order < int.MaxValue ? order + 1 : throw new ArgumentOutOfRangeException(nameof(order)))
        {
            _order = order;
        }
        
        protected override Point3 Evaluate(int index)
        {
            return new Point3(
                (float) Polynomial.Evaluate(Ticks[index], PolyX),
                (float) Polynomial.Evaluate(Ticks[index], PolyY),
                (float) Polynomial.Evaluate(Ticks[index], PolyZ));
        }

        protected override void ComputeFit()
        {
            var weights = new double[Ticks.Length];
            // Positive recency weights in [1,2], based on actual normalized time.
            // Oldest gets 1, newest 2. A zero-variance normal distribution gave all samples 1.
            for (var i = 0; i < weights.Length; i++) weights[i] = 2 + Ticks[i];
            
            PolyX = Fit.PolynomialWeighted(Ticks, XData, weights, _order);
            PolyY = Fit.PolynomialWeighted(Ticks, YData, weights,_order);
            PolyZ = Fit.PolynomialWeighted(Ticks, ZData, weights, _order);
        }
    }
}