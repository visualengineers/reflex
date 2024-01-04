
using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// Butterworth filter implementation according to https://apps.dtic.mil/sti/pdfs/AD1060538.pdf
    /// </summary>
    public class ButterworthFilter : Base2DFilter
    {
        private static readonly double Sqrt2 = Math.Sqrt(2);
        
        public ButterworthFilter(int numSamplesMin = 3) : base(numSamplesMin)
        {
        }

        protected override void ComputeFit()
        {
            PolyX = ComputeSmoothValues(XData, 1, 640);
            PolyY = ComputeSmoothValues(YData, 1, 480);
            PolyZ = ComputeSmoothValues(ZData, 1, 1);
        }

        protected override Point3 Evaluate(int index)
        {
            return new Point3(
                (float) PolyX[index], 
                (float) PolyY[index],
                (float) PolyZ[index]);
        }
        
        private static double[] ComputeSmoothValues(double[] raw, double deltaTimeSec, double cutOff) {
            if (raw == null) 
                return null;
            if (cutOff == 0) 
                return raw;
            
            var samplingRate = 1 / deltaTimeSec;
            var dF2 = raw.Length - 1; // The data range is set with dF2
            var dat2 = new double[dF2 + 4]; // Array with 4 extra points front and back
            var data = new double[raw.Length]; // empty result array
            
            for (var r = 0; r < dF2; r++) {
                dat2[2 + r] = raw[r];
            }
            dat2[1] = dat2[0] = raw[0];
            dat2[dF2 + 3] = dat2[dF2 + 2] = raw[dF2];
            
            var wc = Math.Tan(cutOff * Math.PI / samplingRate);
            var k1 = Sqrt2 * wc;
            var k2 = wc * wc;
            var a = k2 / (1 + k1 + k2);
            var b = 2 * a;
            var c = a;
            var k3 = b / k2;
            var d = -2 * a + k3;
            var e = 1 - (2 * a) - k3;
            
            // RECURSIVE TRIGGERS - ENABLE filter is performed (first, last points constant)
            var datYt = new double[dF2 + 4];
            datYt[1] = datYt[0] = raw[0];
            for (var s = 2; s < dF2 + 2; s++) {
                datYt[s] =   a * dat2[s] + b * dat2[s - 1] + c * dat2[s - 2]
                           + d * datYt[s - 1] + e * datYt[s - 2];
            }
            datYt[dF2 + 3] = datYt[dF2 + 2] = datYt[dF2 + 1];
            
            // FORWARD filter
            var datZt = new double[dF2 + 2];
            datZt[dF2] = datYt[dF2 + 2];
            datZt[dF2 + 1] = datYt[dF2 + 3];
            for (var t = -dF2 + 1; t <= 0; t++) {
                datZt[-t] =   a * datYt[-t + 2] + b * datYt[-t + 3] + c * datYt[-t + 4]
                            + d * datZt[-t + 1] + e * datZt[-t + 2];
            }
            // Calculated points are written
            for (var p = 0; p < dF2; p++) {
                data[p] = datZt[p];
            }
            return data;
        }
    }
}