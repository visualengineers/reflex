using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows.Input;
using Prism.Commands;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Frontend.ServerWPF.Util;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class VectorfieldViewModel : BindableBase
    {
        public static readonly int Skip = 10;

        private bool _isInitialized;
        private bool _showVectors;
        private float _multiplicator;

        public bool ShowVectorField
        {
            get => _showVectors;
            set => SetProperty(ref _showVectors, value);
        }

        public float VectorLengthMultiplicator
        {
            get => _multiplicator;
            set => SetProperty(ref _multiplicator, value);
        }

        public ObservableNotifiableCollection<VectorVisualizationProperties> Vectors { get; private set; }

        public ICommand ToggleVectorVisualizationCommand { get; }     

        public VectorfieldViewModel()
        {
            _isInitialized = false;
            _showVectors = true;
            ToggleVectorVisualizationCommand = new DelegateCommand(ToggleVectors);
            VectorLengthMultiplicator = 600;
        }

        private void ToggleVectors()
        {
            ShowVectorField = !ShowVectorField;
        }

        public void UpdateVectorField(VectorField2 vectorfield)
        {
            if (!ShowVectorField)
                return;

            if (!_isInitialized)
            {
                InitVectorField(vectorfield);
                _isInitialized = true;
                return;
            }

            var array = vectorfield.AsJaggedArray();

            foreach (var vis in Vectors)
            {
                var x = (int)vis.StartPosX;
                var y = (int)vis.StartPosY;

                var vector = array[x][y];

                if (vector.IsValid)
                    vis.Update(vector.X * _multiplicator, vector.Y * _multiplicator);
                else
                    vis.Update(0, 0);
            }

            Vectors?.ItemPropertyChanged?.Invoke(this, null);
        }

        private void InitVectorField(VectorField2 vectorfield)
        {
            var result = new List<VectorVisualizationProperties>();

            for (var i = 0; i < vectorfield.SizeX; i += Skip)
                for (var j = 0; j < vectorfield.SizeY; j += Skip)
                {
                    var vis = new VectorVisualizationProperties(i, j);
                    result.Add(vis);
                }

            Vectors = new ObservableNotifiableCollection<VectorVisualizationProperties>();
            Vectors.AddRange(result);
            RaisePropertyChanged(nameof(Vectors));
        }

    }
}
