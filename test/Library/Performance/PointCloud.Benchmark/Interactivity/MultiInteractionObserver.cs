using System.Diagnostics;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ArrayUtils = PointCloud.Benchmark.Common.ArrayUtils;
using Math = System.Math;

namespace PointCloud.Benchmark.Interactivity
{
    /// <summary>
    /// Finds multiple Interactions on a 2d vectorfield.
    /// </summary>
    public class MultiInteractionObserver : InteractionObserverBase
    {
        #region Fields

        private PointCloud3 _pointCloud;
        private VectorField2 _vectorField;
        private int[][] _confidenceMat;
        private List<Interaction> _candidates;

        private readonly Stopwatch _stopWatch = new();


        #endregion

        #region Properties

        /// <summary>
        /// Gets the type.
        /// </summary>
        /// <value>
        /// The type.
        /// </value>
        public override ObserverType Type => ObserverType.MultiTouch;

        /// <summary>
        /// Gets or sets the point cloud.
        /// </summary>
        /// <value>
        /// The point cloud.
        /// </value>
        public override PointCloud3 PointCloud
        {
            get => _pointCloud;
            set
            {
                if (_pointCloud == value)
                    return;

                _pointCloud = value;
                InitializeConfidenceMatrix();
            }
        }

        /// <summary>
        /// Gets or sets the vector field.
        /// </summary>
        /// <value>
        /// The vector field.
        /// </value>
        public override VectorField2 VectorField
        {
            get => _vectorField;
            set
            {
                if (_vectorField == value)
                    return;

                _vectorField = value;
                InitializeConfidenceMatrix();
            }
        }

        #endregion

        #region Events
        public override event EventHandler<InteractionData> NewInteractions;

        #endregion

        /// <summary>
        /// Initializes a new instance of the <see cref="MultiInteractionObserver"/> class.
        /// </summary>
        public MultiInteractionObserver()
        {
            _candidates = new List<Interaction>();
        }

        /// <summary>
        /// Updates this instance.
        /// </summary>
        public override Task<ProcessingResult> Update()
        {
            if (PointCloud == null ||
               VectorField == null ||
               _confidenceMat == null)
                return Task.FromResult(new ProcessingResult(ProcessServiceStatus.Error));

            var processResult = new ProcessingResult(ProcessServiceStatus.Available);

            var perfItem = new ProcessPerformance();
            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            UpdateVectorfield();

            _candidates.Clear();

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.Preparation = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }



            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.Update = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            var interactions =  ConvertDepthValue(_candidates.ToList());

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.ConvertDepthValue = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            var frame = ComputeSmoothingValue(interactions);

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.Smoothing = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            var confidentInteractions = ApplyConfidenceFilter(frame.Interactions);

            if (MeasurePerformance)
            {
                _stopWatch.Start();
            }

            var processedInteractions = ComputeExtremumType(confidentInteractions.ToList(), PointCloud.AsJaggedArray());

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                perfItem.ComputeExtremumType = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            UpdatePerformanceMetrics(perfItem);


            OnNewInteractions(new InteractionData(processedInteractions, new List<InteractionVelocity>()));

            return Task.FromResult(processResult);
        }

        /// <summary>
        /// Initializes the confidence matrix.
        /// </summary>
        private void InitializeConfidenceMatrix()
        {
            if (VectorField != null)
                ArrayUtils.InitializeArray(out _confidenceMat, VectorField.SizeX, VectorField.SizeY);
        }

        public void UpdateVectorfield()
        {
            var stride = VectorField.Stride;
            var pointCloud = PointCloud.AsJaggedArray();
            var vectorField = VectorField.AsJaggedArray();

            for (var x = stride; x < VectorField.SizeX - stride; x++)
                // Parallel.ForEach(Iterate(stride, VectorField.SizeX - stride, stride), (x) =>
            {
                for (var y = stride; y < VectorField.SizeY - stride; y++)
                {
                    if (!vectorField[x][y].IsValid)
                        continue;

                    var vectorX = vectorField[x][y].Add(vectorField[x + stride][y]);
                    var vectorX2 = vectorField[x][y].Add(vectorField[x - stride][y]);
                    var vectorY = vectorField[x][y].Add(vectorField[x][y + stride]);
                    var vectorY2 = vectorField[x][y].Add(vectorField[x][y - stride]);

                    var angleX = vectorX.AngleBetween(vectorX2);
                    var angleY = vectorY.AngleBetween(vectorY2);
                    var angle = angleX + angleY / 2;

                    var confidence = _confidenceMat[x][y];
                    if (float.IsNaN(angle) || angle > MinAngle)
                    {
                        if (confidence > 0)
                            _confidenceMat[x][y]--;
                    }
                    else
                    {
                        _candidates.Add(new Interaction(new Point3(x, y, pointCloud[x][y].Z), InteractionType.None,
                            confidence));

                        if (confidence < MaxConfidence)
                            _confidenceMat[x][y]++;
                    }
                }
            }
        }

        public void UpdateVectorfieldParallel()
        {
            var stride = VectorField.Stride;
            var pointCloud = PointCloud.AsJaggedArray();
            var vectorField = VectorField.AsJaggedArray();

            // for (var x = stride; x < VectorField.SizeX - stride; x+= stride)
            Parallel.For(stride, VectorField.SizeX - stride, (x) =>
            {
                for (var y = stride; y < VectorField.SizeY - stride; y++)
                {
                    if (!vectorField[x][y].IsValid)
                        continue;

                    var vectorX = vectorField[x][y].Add(vectorField[x + stride][y]);
                    var vectorX2 = vectorField[x][y].Add(vectorField[x - stride][y]);
                    var vectorY = vectorField[x][y].Add(vectorField[x][y + stride]);
                    var vectorY2 = vectorField[x][y].Add(vectorField[x][y - stride]);

                    var angleX = vectorX.AngleBetween(vectorX2);
                    var angleY = vectorY.AngleBetween(vectorY2);
                    var angle = angleX + angleY / 2;

                    var confidence = _confidenceMat[x][y];
                    if (float.IsNaN(angle) || angle > MinAngle)
                    {
                        if (confidence > 0)
                            _confidenceMat[x][y]--;
                    }
                    else
                    {
                        _candidates.Add(new Interaction(new Point3(x, y, pointCloud[x][y].Z), InteractionType.None,
                            confidence));

                        if (confidence < MaxConfidence)
                            _confidenceMat[x][y]++;
                    }
                }
            });
        }

        public void UpdateVectorfieldParallelStepped()
        {
            var stride = VectorField.Stride;
            var pointCloud = PointCloud.AsJaggedArray();
            var vectorField = VectorField.AsJaggedArray();

            // for (var x = stride; x < VectorField.SizeX - stride; x+= stride)
            Parallel.For(1, VectorField.SizeX - stride, (i) =>
            {
                var x = i * stride;

                for (var y = stride; y < VectorField.SizeY - stride; y += stride)
                {
                    var vCenter = vectorField[x][y];

                    if (!vCenter.IsValid)
                        continue;

                    var vectorX = vCenter.Add(vectorField[x + stride][y]);
                    var vectorX2 = vCenter.Add(vectorField[x - stride][y]);
                    var vectorY = vCenter.Add(vectorField[x][y + stride]);
                    var vectorY2 = vCenter.Add(vectorField[x][y - stride]);

                    var angleX = vectorX.AngleBetween(vectorX2);
                    var angleY = vectorY.AngleBetween(vectorY2);
                    var angle = angleX + angleY / 2f;

                    var confidence = _confidenceMat[x][y];
                    if (float.IsNaN(angle) || angle > MinAngle)
                    {
                        if (confidence > 0)
                            _confidenceMat[x][y]--;
                    }
                    else
                    {
                        _candidates.Add(new Interaction(new Point3(x, y, pointCloud[x][y].Z), InteractionType.None,
                            confidence));

                        if (confidence < MaxConfidence)
                            _confidenceMat[x][y]++;
                    }
                }
            });
        }

        public void UpdateVectorfieldStepped1d()
        {
            var stride = VectorField.Stride;
            var pointCloud = PointCloud.AsSpan();
            var vectorField = VectorField.AsArray().AsMemory();

            var width = VectorField.SizeX;

            for (var x = stride; x < VectorField.SizeX - stride; x += stride)
                // Parallel.ForEach(SteppedIterator.SteppedIntegerList(stride, VectorField.SizeX - stride, stride), (x) =>
            {
                for (var y = stride; y < VectorField.SizeY - stride; y += stride)
                {
                    var idx = y * width + x;

                    if (!vectorField.Span[idx].IsValid)
                        continue;

                    // idx = y * width + x + stride == idx + stride
                    var vectorX = vectorField.Span[idx].Add(vectorField.Span[idx + stride]);

                    // idx = y * width + x + stride == idx + stride
                    var vectorX2 = vectorField.Span[idx].Add(vectorField.Span[idx - stride]);

                    var idx2 = (y + stride) * width + x;
                    var vectorY = vectorField.Span[idx].Add(vectorField.Span[idx2]);

                    var idx3 = (y - stride) * width + x;
                    var vectorY2 = vectorField.Span[idx].Add(vectorField.Span[idx3]);

                    var angleX = vectorX.AngleBetween(vectorX2);
                    var angleY = vectorY.AngleBetween(vectorY2);
                    var angle = angleX + angleY / 2;

                    var confidence = _confidenceMat[x][y];
                    if (float.IsNaN(angle) || angle > MinAngle)
                    {
                        if (confidence > 0)
                            _confidenceMat[x][y]--;
                    }
                    else
                    {
                        _candidates.Add(new Interaction(new Point3(x, y, pointCloud[idx].Z), InteractionType.None,
                            confidence));

                        if (confidence < MaxConfidence)
                            _confidenceMat[x][y]++;
                    }
                }
            }
            //);
        }

        public void UpdateVectorfieldSteppedParallel1d()
        {
            var stride = VectorField.Stride;
            var pointCloud = PointCloud.AsMemory();
            var vectorField = VectorField.AsArray().AsMemory();

            var width = VectorField.SizeX;

            // for (var x = stride; x < VectorField.SizeX - stride; x+= stride)
            Parallel.ForEach(SteppedIterator.SteppedIntegerList(stride, VectorField.SizeX - stride, stride), (x) =>
            {
                for (var y = stride; y < VectorField.SizeY - stride; y += stride)
                {
                    var idx = y * width + x;

                    if (!vectorField.Span[idx].IsValid)
                        continue;

                    var vCenter = vectorField.Span[idx];

                    // idx = y * width + x + stride == idx + stride
                    var vectorX = vCenter.Add(vectorField.Span[idx + stride]);

                    // idx = y * width + x + stride == idx + stride
                    var vectorX2 = vCenter.Add(vectorField.Span[idx - stride]);

                    var idx2 = (y + stride) * width + x;
                    var vectorY = vCenter.Add(vectorField.Span[idx2]);

                    var idx3 = (y - stride) * width + x;
                    var vectorY2 = vCenter.Add(vectorField.Span[idx3]);

                    var angleX = vectorX.AngleBetween(vectorX2);
                    var angleY = vectorY.AngleBetween(vectorY2);
                    var angle = angleX + angleY / 2f;

                    var confidence = _confidenceMat[x][y];
                    if (float.IsNaN(angle) || angle > MinAngle)
                    {
                        if (confidence > 0)
                            _confidenceMat[x][y]--;
                    }
                    else
                    {
                        _candidates.Add(new Interaction(new Point3(x, y, pointCloud.Span[idx].Z), InteractionType.None,
                            confidence));

                        if (confidence < MaxConfidence)
                            _confidenceMat[x][y]++;
                    }
                }
            });
            //);
        }

        public IEnumerable<Interaction> ApplyConfidenceFilter1()
        {
            return _candidates.Where(item => item.Confidence > MinConfidence);
        }

        public IEnumerable<Interaction> ApplyConfidenceFilter2()
        {
            return _candidates.ToArray().Where(item => item.Confidence > MinConfidence);
        }

        public IEnumerable<Interaction> ApplyConfidenceFilter3()
        {
            return _candidates.AsReadOnly().Where(item => item.Confidence > MinConfidence);
        }

        public IEnumerable<Interaction> ApplyConfidenceFilter4()
        {
            var span = _candidates.ToArray().AsSpan();
            var result = new List<Interaction>();
            for (var i = 0; i < span.Length; i++)
            {
                var item = span[i];
                if (item.Confidence > MinConfidence)
                    result.Add(item);
            }

            return result;
        }

        /// <summary>
        /// Called when [new interactions].
        /// </summary>
        /// <param name="args">The arguments.</param>
        protected virtual void OnNewInteractions(InteractionData args) => NewInteractions?.Invoke(this, args);


        protected override IEnumerable<Interaction> ApplyConfidenceFilter(IEnumerable<Interaction> interactions)
        {
            return interactions.Where(item => item.Confidence > MinConfidence);
        }



        protected override List<Interaction> ComputeExtremumType(List<Interaction> interactions, Point3[][] pointsArray)
        {
            interactions.ForEach(interaction =>
                interaction.ExtremumDescription = ComputeExtremumType(pointsArray, (int)interaction.Position.X, (int)interaction.Position.Y));

            return interactions;
        }

        /// <summary>
        /// Calculates the average distance for the currently stored PointCloud.
        /// </summary>
        /// <returns></returns>
        public override float CalculateAverageDistance()
        {
            var sum = 0f;
            var points = PointCloud?.AsArray();

            if (points == null)
                return sum;

            var numValidSamples = 0;

            for (var i = 0; i < points.Length; ++i)
            {
                if (!points[i].IsValid || points[i].IsFiltered)
                    continue;

                numValidSamples++;
                sum += points[i].Z;
            }

            return (float) decimal.Round((decimal) (sum / numValidSamples), 2);
        }

        private static Point3 GetSample(Point3[][] pointsArray, int xPos, int yPos, Tuple<int, int>[] samples, int i, int xMax, int yMax)
        {
            var xIdx = xPos + samples[i].Item1;
            xIdx = Math.Min(Math.Max(xIdx, 0), xMax);

            var yIdx = yPos + samples[i].Item2;
            yIdx = Math.Min(Math.Max(yIdx, 0), yMax);
            var sample = pointsArray[xIdx][yIdx];

            return sample;
        }

        private Tuple<int, int>[] GenerateSamples()
        {
            var result = new List<Tuple<int, int>>();

            var rnd = new Random();

            var min = (int)Math.Floor(0.5f * ExtremumTypeCheckRadius);
            var max = ExtremumTypeCheckRadius;

            for (var i = 0; i < ExtremumTypeCheckNumSamples; i++)
            {
                var xStochastic = rnd.Next(min, max);
                var yStochastic = rnd.Next(min, max);

                result.Add(new Tuple<int, int>(xStochastic, yStochastic));
            }

            return result.ToArray();
        }

        private void UpdateSamples()
        {
            var samplesFixed = new List<Tuple<int, int>>();

            for (var i = 0; i < ExtremumTypeCheckNumSamples; i++)
            {
                var p = (float)i / ExtremumTypeCheckRadius;
                var xFixed = (int) Math.Floor(ExtremumTypeCheckRadius * Math.Cos(p * 2 * Math.PI));
                var yFixed = (int) Math.Floor(ExtremumTypeCheckRadius * Math.Sin(p * 2 * Math.PI));

                samplesFixed.Add(new Tuple<int, int>(xFixed, yFixed));
            }
            _fixedSamples = samplesFixed.ToArray();

            _stochasticSamples = GenerateSamples();
        }

    }

}
