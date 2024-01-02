using System;
using System.Runtime.InteropServices;

namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// Offers some useful and fast mathematical functions
    /// </summary>
    public class Math
    {
        #region methods

        /// <summary>
        /// very roughly Approximates the square root of a number z. Variance: approx. 5%.
        /// </summary>
        /// <param name="z">The radicand</param>
        /// <returns>The square root of a number z, <see cref="float.NaN"/> if z is negative.</returns>
        public static float FastSqrt(float z)
        {
            if (z == 0) return 0;
            FloatIntUnion u;
            u.tmp = 0;
            u.f = z;
            u.tmp -= 1 << 23;
            u.tmp >>= 1;
            u.tmp += 1 << 29;
            return u.f;
        }

        /// <summary>
        /// Approximates the square root of a number z. Variance: approx. 2% 
        /// It’s a tad slower than the first (though still nearly 2x as fast as Math.Sqrt()), but much more accurate.
        /// </summary>
        /// <param name="z">The radicand</param>
        /// <returns>The square root of a number z, <see cref="float.NegativeInfinity"/> if z is negative.</returns>
        public static float InverseSqrt(float z)
        {
            if (z == 0) return 0;
            FloatIntUnion u;
            u.tmp = 0;
            var half = 0.5f * z;
            u.f = z;
            u.tmp = 0x5f375a86 - (u.tmp >> 1);
            u.f = u.f * (1.5f - half * u.f * u.f);
            return u.f * z;
        }

        #endregion

        [StructLayout(LayoutKind.Explicit)]
        private struct FloatIntUnion
        {
            [FieldOffset(0)]
            public float f;

            [FieldOffset(0)]
            public int tmp;
        }

        /// <summary>
        /// Remaps the specified value from one range to another range.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="from1">The from1.</param>
        /// <param name="to1">The to1.</param>
        /// <param name="from2">The from2.</param>
        /// <param name="to2">The to2.</param>
        /// <returns>The remapped value.</returns>
        public static double Remap(double value, double from1, double to1, double from2, double to2)
            => (value - from1) / (to1 - from1) * (to2 - from2) + from2;
        
        public static double ExponentialMapping(double input) =>
            System.Math.Exp((input) - 1) / (System.Math.E - 1);

        public static double LogarithmicMapping(double input) =>
            System.Math.Log(input + 1, System.Math.E) / System.Math.Log(2, System.Math.E);
    }
}
