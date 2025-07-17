using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Interactivity.Components
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

        private bool _isProcessing = false;

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
        public override event EventHandler<IList<Interaction>> NewInteractions;

        #endregion

        /// <summary>
        /// Initializes a new instance of the <see cref="MultiInteractionObserver"/> class.
        /// </summary>
        public MultiInteractionObserver()
        {
        }

        protected override Task<ProcessingResult> CheckInitialState()
        {
          if (PointCloud == null ||
              VectorField == null ||
              _confidenceMat == null)
            return Task.FromResult(new ProcessingResult(ProcessServiceStatus.Error));

          var processResult = new ProcessingResult(ProcessServiceStatus.Available);

          return Task.FromResult(
              _isProcessing
                  ? new ProcessingResult(ProcessServiceStatus.Skipped)
                  : processResult);
        }

        /// <summary>
        /// Initializes the confidence matrix.
        /// </summary>
        private void InitializeConfidenceMatrix()
        {
            if (VectorField != null && !_isProcessing)
                ArrayUtils.InitializeArray(out _confidenceMat, VectorField.SizeX, VectorField.SizeY);
        }

        protected override Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
        {
            performance.Preparation = TimeSpan.Zero;

            var stride = VectorField.Stride;
            var pointCloud = PointCloud.AsJaggedArray();
            var vectorField = VectorField.AsJaggedArray();

            var result = new List<Interaction>();

            _isProcessing = true;

            Parallel.For(1, (VectorField.SizeX - 1) / stride, (i) =>
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
                        lock (result)
                        {
                            result.Add(new Interaction(new Point3(x, y, pointCloud[x][y].Z), InteractionType.None,
                                confidence));
                        }

                        if (confidence < MaxConfidence)
                            _confidenceMat[x][y]++;
                    }
                }
            });

            _isProcessing = false;

            return Task.FromResult(new Tuple<IEnumerable<Interaction>, ProcessPerformance>(result.ToArray(), performance));
        }

        /// <summary>
        /// Called when interactions have been processed.
        /// </summary>
        /// <param name="args">The arguments.</param>
        protected override void OnNewInteractions(List<Interaction> args) => NewInteractions?.Invoke(this, args);

    }

}
