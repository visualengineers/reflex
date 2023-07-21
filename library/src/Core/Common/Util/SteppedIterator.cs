using System.Collections.Generic;

namespace ReFlex.Core.Common.Util
{
    public class SteppedIterator
    {
        public static IEnumerable<int> SteppedIntegerList(int startIndex,
            int endIndex, int stepSize)
        {
            for (var i = startIndex; i < endIndex; i += stepSize)
            {
                yield return i;
            }
        }
    }
}