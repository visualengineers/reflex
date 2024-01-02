using System;
using System.Collections.Generic;
using System.Linq;
using MathNet.Numerics.LinearAlgebra;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public class SavitzkyGolayFilter : IPointFilter
    {
        private readonly int _sidePoints;

        private Matrix<double> _coefficients;

        public int MinNumSamples => 2 * _sidePoints + 1;

        public SavitzkyGolayFilter(int sidePoints, int polynomialOrder)
        {
            _sidePoints = sidePoints;
            Design(polynomialOrder);
        }

        public List<Point3> Process(List<Point3> samples)
        {
            if (samples == null || samples.Count == 0)
            {
                return null;
            }
            
            if (samples.Count < MinNumSamples)
                return samples; 
            
            var filteredX = ProcessRow(samples.Select(interaction => (double) interaction.X).ToArray());
            var filteredY = ProcessRow(samples.Select(interaction => (double) interaction.Y).ToArray());
            var filteredZ = ProcessRow(samples.Select(interaction => (double) interaction.Z).ToArray());

            var result = new List<Point3>();

            for (var index = 0; index < filteredX.Length; index++)
            {
                result.Add(new Point3((float) filteredX[index],(float) filteredY[index],(float) filteredZ[index]));
            }

            return result;
        }

        /// <summary>
        /// Smoothes the input samples.
        /// </summary>
        /// <param name="samples"></param>
        /// <returns></returns>
        private double[] ProcessRow(double[] samples)
        {
            var length = samples.Length;
            var output = new double[length];
            var frameSize = (_sidePoints << 1) + 1;
            var frame = new double[frameSize];

            Array.Copy(samples, frame, frameSize);

            for (var i = 0; i < _sidePoints; ++i)
            {
                output[i] = _coefficients.Column(i).DotProduct(Vector<double>.Build.DenseOfArray(frame));
            }

            for (var i = _sidePoints; i < length - _sidePoints; ++i)
            {
                Array.ConstrainedCopy(samples, i - _sidePoints, frame, 0, frameSize);
                output[i] = _coefficients.Column(_sidePoints).DotProduct(Vector<double>.Build.DenseOfArray(frame));
            }

            Array.ConstrainedCopy(samples, length - frameSize, frame, 0, frameSize);

            for (var i = 0; i < _sidePoints; ++i)
            {
                output[length - _sidePoints + i] = _coefficients.Column(_sidePoints + 1 + i).DotProduct(Vector<double>.Build.Dense(frame));
            }

            return output;
        }


        private void Design(int polynomialOrder)
        {
            var a = new double[(_sidePoints << 1) + 1, polynomialOrder + 1];

            for (var m = -_sidePoints; m <= _sidePoints; ++m)
            {
                for (var i = 0; i <= polynomialOrder; ++i)
                {
                    a[m + _sidePoints, i] = System.Math.Pow(m, i);
                }
            }

            var s = Matrix<double>.Build.DenseOfArray(a);
            _coefficients = s.Multiply(s.TransposeThisAndMultiply(s).Inverse()).Multiply(s.Transpose());
        }
        
        
    }
}