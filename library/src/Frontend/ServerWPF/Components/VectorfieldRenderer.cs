using System.Collections.Specialized;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;
using ReFlex.Frontend.ServerWPF.Util;

namespace ReFlex.Frontend.ServerWPF.Components
{
    public class VectorfieldRenderer : FrameworkElement
    {
        #region Fields

        private bool _isRendering = false;

        #endregion

        #region DependencyProperties

        public static readonly DependencyProperty ItemsSourceProperty =
            DependencyProperty.Register("ItemsSource",
                typeof(ObservableNotifiableCollection<VectorVisualizationProperties>),
                typeof(VectorfieldRenderer),
                new PropertyMetadata(OnItemsSourceChanged));

        public static readonly DependencyProperty BrushesProperty =
            DependencyProperty.Register("Brushes",
                typeof(Brush[]),
                typeof(VectorfieldRenderer),
                new FrameworkPropertyMetadata(null,
                    FrameworkPropertyMetadataOptions.AffectsRender));

        public static readonly DependencyProperty BackgroundProperty =
            Panel.BackgroundProperty.AddOwner(typeof(VectorfieldRenderer));

        #endregion

        #region Properties

        public ObservableNotifiableCollection<VectorVisualizationProperties> ItemsSource
        {
            set => SetValue(ItemsSourceProperty, value);
            get => (ObservableNotifiableCollection<VectorVisualizationProperties>)GetValue(ItemsSourceProperty);
        }

        public Brush[] Brushes
        {
            set => SetValue(BrushesProperty, value);
            get => (Brush[])GetValue(BrushesProperty);
        }

        public Brush Background
        {
            set => SetValue(BackgroundProperty, value);
            get => (Brush)GetValue(BackgroundProperty);
        }        

        #endregion

        #region DepencyPropertyChangedHandling

        private static void OnItemsSourceChanged(DependencyObject obj, DependencyPropertyChangedEventArgs args) =>
            (obj as VectorfieldRenderer)?.OnItemsSourceChanged(args);

        private void OnItemsSourceChanged(DependencyPropertyChangedEventArgs args)
        {
            if (args.OldValue != null)
            {
                if (args.OldValue is ObservableNotifiableCollection<VectorVisualizationProperties> coll)
                {
                    coll.CollectionChanged -= OnCollectionChanged;
                    coll.ItemPropertyChanged -= OnItemPropertyChanged;
                }
            }

            if (args.NewValue != null)
            {
                if (args.NewValue is ObservableNotifiableCollection<VectorVisualizationProperties> coll)
                {
                    coll.CollectionChanged += OnCollectionChanged;
                    coll.ItemPropertyChanged += OnItemPropertyChanged;
                }
            }

            ForceRefresh();
        }

        private void OnCollectionChanged(object sender, NotifyCollectionChangedEventArgs args)
        {
            ForceRefresh();
        }

        private void OnItemPropertyChanged(object sender, ItemPropertyChangedEventArgs args)
        {
            ForceRefresh();
        }

        #endregion

        #region Method override

        protected override void OnRender(DrawingContext context)
        {
            context.DrawRectangle(Background, null, new Rect(RenderSize));

            if (ItemsSource == null)
                return;

            foreach (var vector in ItemsSource)
            {
                context.DrawLine(new Pen(new SolidColorBrush(vector.Color), 1), 
                    new Point(vector.StartPosX, vector.StartPosY), null, 
                    new Point(vector.EndPosX, vector.EndPosY), null);
            }

            _isRendering = false;
        }

        #endregion

        #region Methods

        private void ForceRefresh()
        {
            if (_isRendering)
                return;

            _isRendering = true;
            Dispatcher.Invoke(() => InvalidateVisual(), DispatcherPriority.Background);
        }

        #endregion

    }
}
