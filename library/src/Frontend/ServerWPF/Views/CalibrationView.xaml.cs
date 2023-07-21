using System.Windows;
using System.Windows.Input;
using ReFlex.Frontend.ServerWPF.ViewModels;

namespace ReFlex.Frontend.ServerWPF.Views
{
    /// <summary>
    /// Interaktionslogik für CalibrationView.xaml
    /// </summary>
    public partial class CalibrationView
    {
        public CalibrationView()
        {
            InitializeComponent();
        }

        private void SetCalibrationPoint(object sender, MouseButtonEventArgs args)
        {
            var element = (FrameworkElement)sender;

            if (!(element?.DataContext is CalibrationViewModel viewModel))
                return;

            var position = args.GetPosition(element);
            viewModel.SetPositionAndAdvanceToNextPoint(position);
        }

        private void SelectCalibrationPoint(object sender, MouseButtonEventArgs args)
        {
            if (args.LeftButton != MouseButtonState.Pressed)
                return;

            var element = (FrameworkElement)sender;

            if (!(element?.DataContext is CalibrationPointViewModel viewModel))
                return;

            viewModel.IsSelected = true;
        }

        private void UnselectCalibrationPoint(object sender, MouseEventArgs args)
        {
            var element = (FrameworkElement)sender;

            if (!(element?.DataContext is CalibrationPointViewModel viewModel))
                return;

            viewModel.IsSelected = false;
        }

        private void MoveCalibrationPoint(object sender, MouseEventArgs args)
        {
            if (args.LeftButton != MouseButtonState.Pressed)
                return;

            var element = (FrameworkElement)sender;

            if (!(element?.DataContext is CalibrationPointViewModel viewModel))
                return;

            if (!viewModel.IsSelected)
                return;

            var position = args.GetPosition(CalibrationCanvas);
            viewModel.UpdatePosition(position);
        }
    }
}
