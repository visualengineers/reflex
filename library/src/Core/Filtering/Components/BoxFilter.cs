using System;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// A two-dimensional box-blur with separated kernels
    /// </summary>
    [Obsolete]
    public class BoxFilter
    {
        #region fields

        private int _radius, _diameter;

        #endregion

        #region properties

        /// <summary>
        /// Gets or sets the radius.
        /// </summary>
        /// <value>
        /// The radius.
        /// </value>
        public int Radius
        {
            get => _radius;
            set => SetRadius(value);
        }
        
        public float DefaultValue { get; set; }

        #endregion

        #region constructor

        /// <summary>
        /// Initializes a new instance of the <see cref="BoxFilter"/> class.
        /// </summary>
        /// <param name="radius">The radius.</param>
        public BoxFilter(int radius) => SetRadius(radius);

        #endregion

        #region methods

        /// <summary>
        /// Filters highly frequented changes in a field of <see cref="Point3"/>.
        /// </summary>
        public void Filter(Point3[] depthData, PointCloud3 target)
        {
            var targetRef = depthData.AsSpan();
            var width = target.SizeX;
            var height = target.SizeY;

            // x direction
            for(var y = 0; y < height; ++y)
            {
                ComputeIndex(0, y, width, out var idx);
                var start = targetRef[idx];
                var sum = DefaultValue * _diameter;

                for (var x = 0; x < width; x++)
                {
                    var nrad = x - _radius - 1;
                    var prad = x + _radius;

                    ComputeIndex(nrad, y, width, out var iSub);
                    ComputeIndex(prad, y, width, out var iAdd);
                    
                    ComputeIndex(width-1, y, width, out var iEnd);
                    
                    var sub = nrad >= 0 ? targetRef[iSub] : start;
                    var add = prad < width ? targetRef[iAdd] : targetRef[iSub];

                    sum -= sub.IsValid ? sub.Z : DefaultValue;
                    sum += add.IsValid ? add.Z : DefaultValue;
                    
                    
                    ComputeIndex(x, y, width, out var iSum);
                    targetRef[iSum].Z = sum / _diameter;
                }
            }

            // y direction
            for (var x = 0; x < width; ++x)
            {
                ComputeIndex(x, 0, width, out var idx);
                var start = targetRef[idx];
                var sum = DefaultValue * _diameter;

                for (var y = 0; y < height; y++)
                {
                    var nrad = y - _radius - 1;
                    var prad = y + _radius;

                    ComputeIndex(x, nrad, width, out var iSub);
                    ComputeIndex(x, prad, width, out var iAdd);
                    
                    ComputeIndex(x, height -1, width, out var iEnd);
                    
                    var sub = nrad >= 0 ? targetRef[iSub] : start;
                    var add = prad < height ? targetRef[iAdd] : targetRef[iEnd];

                    sum -= sub.IsValid ? sub.Z : DefaultValue;
                    sum += add.IsValid ? add.Z : DefaultValue;
                    
                    ComputeIndex(x, y, width, out var iSum);

                    targetRef[iSum].Z = sum / _diameter;
                }
            }

            var targetSpan = target.AsSpan();
        
            for (var i = 0; i < targetRef.Length; i++)
            {
                targetSpan[i].Set(targetRef[i]);
            }
        }
        
        
        public void ComputeColRow(int idx, int width, out int x, out int y)
        {
            x = idx % width;
            y = idx / width;
        }

        public void ComputeIndex(int x, int y, int width, out int index)
        {
            index = y * width + x;
        }
        
        /// <summary>
        /// Sets the radius and calculates the diameter.
        /// </summary>
        /// <param name="radius">The radius.</param>
        private void SetRadius(int radius)
        {
            _radius = radius;
            _diameter = radius * 2 + 1;
        }

        #endregion
    }
}
