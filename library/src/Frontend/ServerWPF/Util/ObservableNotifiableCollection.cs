using System;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;

namespace ReFlex.Frontend.ServerWPF.Util
{
    public class ObservableNotifiableCollection<T> :
        ObservableCollection<T> where T : INotifyPropertyChanged
    {
        public ItemPropertyChangedEventHandler ItemPropertyChanged;
        public EventHandler CollectionCleared;

        protected override void OnCollectionChanged(
            NotifyCollectionChangedEventArgs args)
        {
            base.OnCollectionChanged(args);

            if (args.NewItems != null)
                foreach (INotifyPropertyChanged item in args.NewItems)
                    item.PropertyChanged += OnItemPropertyChanged;

            if (args.OldItems != null)
                foreach (INotifyPropertyChanged item in args.OldItems)
                    item.PropertyChanged -= OnItemPropertyChanged;
        }

        private void OnItemPropertyChanged(object sender, PropertyChangedEventArgs args) =>
            ItemPropertyChanged?.Invoke(this, new ItemPropertyChangedEventArgs(sender, args.PropertyName));

        protected override void ClearItems()
        {
            foreach (var item in Items)
                item.PropertyChanged -= OnItemPropertyChanged;

            CollectionCleared?.Invoke(this, EventArgs.Empty);

            base.ClearItems();
        }
    }

}
