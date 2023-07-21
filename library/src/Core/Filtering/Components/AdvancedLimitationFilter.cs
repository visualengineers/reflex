using System;
using System.Threading;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public class AdvancedLimitationFilter : LimitationFilter
    {
        private bool[][] _filterMask;

        private bool _isFiltering;

        private float _zeroPlaneValue = 0f;
        private float _threshold = 0.01f;

        private bool _warningMessageSent = false;

        public bool[][] FilterMask
        {
            get => _filterMask;
            set
            {
                _filterMask = value;
                if (_filterMask != null)
                {
                    IsInitialized = true;
                    IsInitializing = false;
                }

            }
        }

        public AdvancedLimitationFilter(int inputSizeX, int inputSizeY) : base(inputSizeX, inputSizeY)
        {
            IsInitialized = false;
        }

        public bool ClearMask(float zeroPlaneValue, float threshold)
        {
            _zeroPlaneValue = zeroPlaneValue;
            _threshold = threshold;
            return ResetMask();
        }

        public bool ResetMask()
        {
            if (IsInitializing)
                return false;

            _filterMask = null;
            IsInitialized = false;
            _warningMessageSent = false;

            return true;
        }

        public int InitializeMask(PointCloud3 depthValues, int iteration, bool lastIteration)
        {
            IsInitializing = true;
            
            try
            {
                while (_isFiltering)
                {
                    Thread.Sleep(100);
                }

                if (depthValues == null)
                {
                    Logger.Warn(
                        $"Pointcloud for initializing Filter in {GetType().FullName} is null or has the wrong dimensions.");

                    IsInitialized = false;
                    return -1;
                }

                if (iteration == 0)
                {
                    _filterMask = new bool[depthValues.SizeX][];
                    for (var x = 0; x < depthValues.SizeX; x++)
                    {
                        _filterMask[x] = new bool[depthValues.SizeY];

                        for (var y = 0; y < depthValues.SizeY; y++)
                        {
                            _filterMask[x][y] = true;
                        }
                    }
                }

                var array = depthValues.AsJaggedArray();

                for (var x = 0; x < array.Length; x++)
                {
                    var col = array[x];

                    for (var y = 0; y < col.Length; y++)
                    {
                        var depth = col[y].Z;
                        var isOnZeroPlane = Math.Abs(depth - _zeroPlaneValue) < _threshold;
                        _filterMask[x][y] = _filterMask[x][y] && isOnZeroPlane;
                    }
                }

                if (lastIteration)
                {
                    IsInitialized = true;
                    IsInitializing = false;
                }
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
                IsInitializing = false;
                IsInitialized = false;
            }

            return iteration;
        }

        protected override void IteratePointCloud(int width, int height, Point3[] source, Point3[][] targetRef)
        {
            if (_filterMask == null || !IsInitialized || _filterMask.Length != width ||
                _filterMask[0].Length != height)
            {
                if (!_warningMessageSent)
                {
                    Logger.Warn(
                        $"no valid Filter Mask provided in {GetType().FullName}: Filter fallback to {typeof(LimitationFilter).FullName}");
                    _warningMessageSent = true;
                }

                base.IteratePointCloud(width, height, source, targetRef);
                return;
            }

            _isFiltering = true;

            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var idx = y * width + x;
                    
                    // skip borders
                    var isValid =
                        x >= CropSize[0] &&
                        x <= CropSize[1] &&
                        y >= CropSize[2] &&
                        y <= CropSize[3];

                    isValid = isValid && _filterMask != null && _filterMask[x][y];
                    isValid = isValid && source[idx].Z > MinDistanceFromSensor;

                    targetRef[x][y].IsValid = isValid;
                    targetRef[x][y].IsFiltered = !isValid;

                    if (isValid) 
                        continue;
                    
                    source[idx].Z = _zeroPlaneValue;

                }
            }

            _isFiltering = false;
        }
    }
}