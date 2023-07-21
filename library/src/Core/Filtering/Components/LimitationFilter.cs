using System;
using System.Xml.Serialization;
using ReFlex.Core.Common.Components;
using NLog;

namespace ReFlex.Core.Filtering.Components
{
    public class LimitationFilter
    {
        protected static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        protected readonly int[] CropSize;

        protected int CropSizeX => CropSize[1] - CropSize[0];

        protected int CropSizeY => CropSize[3] - CropSize[2];

        public int LeftBound
        {
            get => CropSize[0];
            set => CropSize[0] = value;
        }

        public int RightBound
        {
            get => CropSize[1];
            set => CropSize[1] = value;
        }

        public int UpperBound
        {
            get => CropSize[2];
            set => CropSize[2] = value;
        }

        public int LowerBound
        {
            get => CropSize[3];
            set => CropSize[3] = value;
        }

        public float MinDistanceFromSensor { get; set; } = 0.01f;
        
        public bool IsInitializing { get; protected set; } = false;
        
        public bool IsInitialized { get; protected set; } = true;

        public LimitationFilter(int inputSizeX, int inputSizeY)
        {
            CropSize = new[] { 0, inputSizeX, 0, inputSizeY };
        }

        public void Filter(Point3[] source, PointCloud3 target)
        {
            CheckPointCloudValidity(target);
            
            var targetRef = target.AsJaggedArray();
            var width = target.SizeX;
            var height = target.SizeY;
            
            IteratePointCloud(width, height, source, targetRef);
        }

        protected virtual void CheckPointCloudValidity(PointCloud3 target)
        {
            if (target == null)
            {
                Logger.Error($"Cannot filter PointCloud with {GetType().FullName} - provided PointCloud is null.");
                throw new NullReferenceException();
            }

            if (target.Size < CropSizeX * CropSizeY) {
                Logger.Warn($"[{GetType().Name}]: Invalid Bounds of [{UpperBound} | {LeftBound} | {LowerBound} | {RightBound}]. Resetting to [0 | 0 | {target.SizeY} | {target.SizeX}].");
                ResetBounds(target.SizeX, target.SizeY);
            }

            if (CropSizeX * CropSizeY < 0) {
                Logger.Warn($"[{GetType().Name}]: Bounds result in negative width / height: [{UpperBound} | {LeftBound} | {LowerBound} | {RightBound}]. Resetting to [0 | 0 | {target.SizeY} | {target.SizeX}].");
                ResetBounds(target.SizeX, target.SizeY);
            }
        }

        protected virtual void IteratePointCloud(int width, int height, Point3[] source, Point3[][] targetRef)
        {
            for (var y = 0; y < height;  ++y)
            {
                for (var x = 0; x < width; ++x)
                {
                    var idx = y * width + x;
                    
                    var isValid =
                        x >= CropSize[0] &&
                        x <= CropSize[1] &&
                        y >= CropSize[2] &&
                        y <= CropSize[3];

                    isValid = isValid && source[idx].Z > MinDistanceFromSensor;
                    
                    targetRef[x][y].IsValid = isValid;
                    targetRef[x][y].IsFiltered = !isValid;
                }
            }
        }

        protected void ResetBounds(int width, int height) {
            UpperBound = 0;
            LeftBound = 0;
            LowerBound = height;
            RightBound = width;
        }
    }
}
