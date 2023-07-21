using System;

namespace ReFlex.Core.Common.Util
{
    public class Math
    {
        public static T Clamp<T>(T value, T max, T min)
            where T : IComparable<T>
        {
            var result = value;
            if (value.CompareTo(max) > 0)
                result = max;
            if (value.CompareTo(min) < 0)
                result = min;
            return result;
        }
    }
}
