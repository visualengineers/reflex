using System;
using MathNet.Numerics;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public class PolynomialFitFilter : Base2DFilter
    {
        private readonly int _order;

        public PolynomialFitFilter(int order = 3) : base(order >= 0 && order < int.MaxValue ? order + 1 : throw new ArgumentOutOfRangeException(nameof(order)))
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
            PolyX = Fit.Polynomial(Ticks, XData, _order);
            PolyY = Fit.Polynomial(Ticks, YData, _order);
            PolyZ = Fit.Polynomial(Ticks, ZData, _order);
        }
    }
}