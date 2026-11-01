using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Implementation.Interfaces;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Interactivity.Util;

namespace Implementation.Components
{
    public class InteractionManager : IInteractionManager, IDisposable
    {
        private IInteractionObserver _interactionObserver;
        private IList<Interaction> _interactions;
        private bool _useVelocityPrediction;
        private double _predictionHorizonSeconds = .05;
        private int _numFramesForPrediction = 3;
        private bool _useSecondDerivation;
        private float _secondDerivationMagnitude = .5f;
        private readonly IDepthImageManager _depthImageManager;
        private readonly IPerformanceAggregator _performanceAggregator;

        private readonly IRemoteInteractionProcessorService _service;

        private float _distance;
        private float _minDistance;
        private float _maxDistance;
        private float _minAngle;
        private int _minConfidence;
        private int _maxConfidence;
        private int _numSmoothFrames;
        private int _interactionHistorySize;
        private double _contactRetentionSeconds = .1;
        private float _smoothingDistanceSquared = 64f;
        private float _depthScale = 100.0f;
        private int _extremumTypeCheckNumSamples;
        private int _extremumTypeCheckRadius;
        private float _extremumTypeCheckFittingPercentage;
        private ExtremumTypeCheckMethod _extremumTypeCheckMethod;

        public IList<Interaction> Interactions => _interactions ?? new List<Interaction>();

        public double PredictionHorizonSeconds
        {
            get => _interactionObserver?.PredictionHorizonSeconds ?? _predictionHorizonSeconds;
            set
            {
                if (_interactionObserver != null) _interactionObserver.PredictionHorizonSeconds = value;
                _predictionHorizonSeconds = value;
            }
        }

        public bool UseVelocityPrediction
        {
            get => _interactionObserver?.UseVelocityPrediction ?? _useVelocityPrediction;
            set
            {
                if (_interactionObserver != null) _interactionObserver.UseVelocityPrediction = value;
                _useVelocityPrediction = value;
            }
        }

        public int NumFramesForPrediction
        {
            get => _interactionObserver?.NumFramesForPrediction ?? _numFramesForPrediction;
            set
            {
                if (_interactionObserver != null) _interactionObserver.NumFramesForPrediction = value;
                _numFramesForPrediction = value;
            }
        }

        public bool UseSecondDerivation
        {
            get => _interactionObserver?.UseSecondDerivation ?? _useSecondDerivation;
            set
            {
                if (_interactionObserver != null) _interactionObserver.UseSecondDerivation = value;
                _useSecondDerivation = value;
            }
        }

        public float SecondDerivationMagnitude
        {
            get => _interactionObserver?.SecondDerivationMagnitude ?? _secondDerivationMagnitude;
            set
            {
                if (_interactionObserver != null) _interactionObserver.SecondDerivationMagnitude = value;
                _secondDerivationMagnitude = value;
            }
        }

        public ObserverType Type
        {
            get => _interactionObserver?.Type ?? ObserverType.None;
            set
            {
                switch (value)
                {
                    case ObserverType.Remote:
                        UpdateObserver(new RemoteInteractionProcessor(_service));
                        break;
                    case ObserverType.MultiTouch:
                        UpdateObserver(new MultiInteractionObserver());

                        break;
                    case ObserverType.SingleTouch:
                        UpdateObserver(new SingleInteractionObserver());

                        break;
                    case ObserverType.None:
                        UpdateObserver(new NoInteractionObserver());
                        break;
                    default:
                        throw new ArgumentOutOfRangeException(nameof(value), value, null);
                }
            }
        }

        public float ComputeZeroPlaneDistance()
        {
            if (_interactionObserver == null)
                return 0;

            return _interactionObserver.CalculateAverageDistance();
        }

        private void UpdateObserver(IInteractionObserver observer)
        {
            if (_interactionObserver != null)
            {
                _interactionObserver.NewInteractions -= OnNewInteractions;
                _interactionObserver.NewVelocities -= OnNewVelocities;
                _interactionObserver.InteractionHistoryUpdated -= OnHistoryUpdated;
                _performanceAggregator.UnregisterReporter(observer as IPerformanceReporter);
            }
            
            if (observer == null)
                return;

            observer.Distance = _distance;
            observer.MinDistance = _minDistance;
            observer.MaxDistance = _maxDistance;
            observer.MinConfidence = _minConfidence;
            observer.MaxConfidence = _maxConfidence;
            observer.MinAngle = _minAngle;
            observer.PointCloud = _depthImageManager.PointCloud;
            observer.VectorField = _depthImageManager.VectorField;
            observer.InteractionHistorySize = _interactionHistorySize;
            observer.NumSmoothingFrames = _numSmoothFrames;
            observer.TouchMergeDistance2D = _smoothingDistanceSquared;
            observer.ContactRetentionSeconds = _contactRetentionSeconds;
            observer.DepthScale = _depthScale;
            observer.PredictionHorizonSeconds = _predictionHorizonSeconds;
            observer.UseVelocityPrediction = _useVelocityPrediction;
            observer.NumFramesForPrediction = _numFramesForPrediction;
            observer.UseSecondDerivation = _useSecondDerivation;
            observer.SecondDerivationMagnitude = _secondDerivationMagnitude;
            observer.ExtremumTypeCheckRadius = _extremumTypeCheckRadius;
            observer.ExtremumTypeCheckNumSamples = _extremumTypeCheckNumSamples;
            observer.ExtremumTypeCheckFittingPercentage = _extremumTypeCheckFittingPercentage;
            observer.ExtremumTypeCheckMethod = _extremumTypeCheckMethod;
            _interactionObserver = observer;

            _interactionObserver.NewInteractions += OnNewInteractions;
            _interactionObserver.NewVelocities += OnNewVelocities;
            _interactionObserver.InteractionHistoryUpdated += OnHistoryUpdated;
            _performanceAggregator.RegisterReporter(_interactionObserver as IPerformanceReporter);
        }

        private void OnHistoryUpdated(object sender, IList<InteractionFrame> e)
        {
            InteractionHistoryUpdated?.Invoke(this, e);
        }

        public float Distance
        {
            get => _interactionObserver?.Distance ?? 0;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.Distance = value;

                _distance = value;
            }
        }

        public float MinDistance
        {
            get => _interactionObserver?.MinDistance ?? 0;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.MinDistance = value;

                _minDistance = value;
            }
        }

        public float MaxDistance
        {
            get => _interactionObserver?.MaxDistance ?? 0;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.MaxDistance = value;

                _maxDistance = value;
            }
        }

        public float MinAngle
        {
            get => _interactionObserver?.MinAngle ?? 0;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.MinAngle = value;

                _minAngle = value;
            }
        }

        public int MinConfidence
        {
            get => (int)(_interactionObserver?.MinConfidence ?? 0);
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.MinConfidence = value;

                _minConfidence = value;
            }
        }

        public int MaxConfidence
        {
            get => (int)(_interactionObserver?.MaxConfidence ?? 0);
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.MaxConfidence = value;

                _maxConfidence = value;
            }
        }
        
        public int InteractionHistorySize
        {
            get => _interactionObserver?.InteractionHistorySize ?? 0;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.InteractionHistorySize = value;

                _interactionHistorySize = value;
            }
        }

        public int NumSmoothingFrames
        {
            get => _interactionObserver?.NumSmoothingFrames ?? 0;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.NumSmoothingFrames = value;
            
                _numSmoothFrames = value;
            }
        }
        
        public double ContactRetentionSeconds
        {
            get => _interactionObserver?.ContactRetentionSeconds ?? _contactRetentionSeconds;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.ContactRetentionSeconds = value;
            
                _contactRetentionSeconds = double.IsFinite(value) && value >= 0 ? value :
                    throw new ArgumentOutOfRangeException(nameof(value));
            }
        }
        
        public float TouchMergeDistance2D
        {
            get => _interactionObserver?.TouchMergeDistance2D ?? 0f;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.TouchMergeDistance2D = value;

                _smoothingDistanceSquared = value;
            }
        }
        
        public float DepthScale
        {
            get => _interactionObserver?.DepthScale ?? 0f;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.DepthScale = value;

                _depthScale = value;
            }
        }

        public FilterType FilterType { 
            get => _interactionObserver?.FilterType ?? FilterType.None;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.FilterType = value;
            }
        }

        public int ExtremumTypeCheckNumSamples
        {
            get => _interactionObserver?.ExtremumTypeCheckNumSamples ?? _extremumTypeCheckNumSamples;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.ExtremumTypeCheckNumSamples = value;
                _extremumTypeCheckNumSamples = value;
            }
        }

        public int ExtremumTypeCheckRadius
        {
            get => _interactionObserver?.ExtremumTypeCheckRadius ?? _extremumTypeCheckRadius;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.ExtremumTypeCheckRadius = value;
                _extremumTypeCheckRadius = value;
            }
        }

        public float ExtremumTypeCheckFittingPercentage
        {
            get => _interactionObserver?.ExtremumTypeCheckFittingPercentage ?? _extremumTypeCheckFittingPercentage;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.ExtremumTypeCheckFittingPercentage = value;
                _extremumTypeCheckFittingPercentage = value;
            }
        }

        public ExtremumTypeCheckMethod ExtremumTypeCheckMethod
        {
            get => _interactionObserver?.ExtremumTypeCheckMethod ?? _extremumTypeCheckMethod;
            set
            {
                if (_interactionObserver != null)
                    _interactionObserver.ExtremumTypeCheckMethod = value;
                _extremumTypeCheckMethod = value;
            }
        }

        public PointCloud3 PointCloud
        {
            get => _interactionObserver?.PointCloud;
            set => _interactionObserver.PointCloud = value;
        }

        public VectorField2 VectorField
        {
            get => _interactionObserver?.VectorField;
            set => _interactionObserver.VectorField = value;
        }

        public float InputDistance { get; set; }

        public InteractionManager(IDepthImageManager depthImageManager, IRemoteInteractionProcessorService service, IPerformanceAggregator performanceAggregator)
        {
            _depthImageManager = depthImageManager;
            _service = service;
            _performanceAggregator = performanceAggregator;

            depthImageManager.PointcloudFiltered += OnPointcloudChanged;
            depthImageManager.VectorfieldChanged += OnVectorfieldChanged;
        }

        public void Init(ObserverType type)
        {
            Type = type;
        }

        public async Task<ProcessServiceStatus> Update()
        {
            if (_interactionObserver == null)
                return ProcessServiceStatus.Error;
            
            return (await _interactionObserver.Update())?.ServiceStatus ?? ProcessServiceStatus.Error;
        }

        public event EventHandler<IList<Interaction>> InteractionsUpdated;
        public event EventHandler<IList<InteractionVelocity>> VelocitiesUpdated;

        private void OnNewVelocities(object sender, IList<InteractionVelocity> velocities)
            => VelocitiesUpdated?.Invoke(this, velocities);
        
        public event EventHandler<IList<InteractionFrame>> InteractionHistoryUpdated;

        public void Dispose()
        {
            if (_depthImageManager != null)
            {
                _depthImageManager.PointcloudFiltered -= OnPointcloudChanged;
                _depthImageManager.VectorfieldChanged -= OnVectorfieldChanged;
            }

            if (_interactionObserver != null)
            {
                _interactionObserver.NewInteractions -= OnNewInteractions;
                _interactionObserver.NewVelocities -= OnNewVelocities;
                _interactionObserver.InteractionHistoryUpdated -= OnHistoryUpdated;

                _performanceAggregator.UnregisterReporter(_interactionObserver as IPerformanceReporter);
            }
        }

        private void OnPointcloudChanged(object sender, PointCloud3 source)
        {
            if (_interactionObserver != null)
                _interactionObserver.PointCloud = source;
        }

        private void OnVectorfieldChanged(object sender, VectorField2 source)
        {
            if (_interactionObserver != null)
                _interactionObserver.VectorField = source;
        }

        private void OnNewInteractions(object sender, IList<Interaction> interactions)
        {
            lock (interactions)
            {
                var copy = interactions.Select(interaction => new Interaction(interaction)).ToList();
                _interactions = RemoveClusteredInteractions(copy);
            }

            InteractionsUpdated?.Invoke(this, _interactions); 
        }

        private IList<Interaction> RemoveClusteredInteractions(IList<Interaction> rawInteractions)
        {
            var filteredCopy = new List<Interaction>();
            
            for (var i = 0; i < rawInteractions.Count; i++)
            {
                var currPt = rawInteractions[i];
                var distances = filteredCopy.Select(inter => Point3.Squared2DDistance(inter.Position, currPt.Position)).ToList();

                var addPoint = true;
                
                for (var j = 0; j < distances.Count; j++)
                {
                    var distance = distances[j];
                    if (distance < InputDistance)
                    {
                        addPoint = false;
                        break;
                    }
                }
                if (addPoint)
                    filteredCopy.Add(currPt);
            }
            return filteredCopy;
        }


    }
}
