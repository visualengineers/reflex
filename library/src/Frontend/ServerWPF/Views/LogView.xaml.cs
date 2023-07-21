using System.Collections.Specialized;

namespace ReFlex.Frontend.ServerWPF.Views
{
    /// <summary>
    /// Interaction logic for LogView.xaml
    /// </summary>
    public partial class LogView
    {
        public LogView()
        {
            InitializeComponent();
            ((INotifyCollectionChanged)ListView.Items).CollectionChanged += ListView_CollectionChanged;
        }

        private void ListView_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
        {
            LogViewer.ScrollToEnd();
        }
    }
}
