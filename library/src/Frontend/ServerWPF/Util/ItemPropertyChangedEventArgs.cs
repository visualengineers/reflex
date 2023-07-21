using System.ComponentModel;

namespace ReFlex.Frontend.ServerWPF.Util
{
    public class ItemPropertyChangedEventArgs : PropertyChangedEventArgs
    {
        public ItemPropertyChangedEventArgs(object item, string propertyName) : base(propertyName) => Item = item;

        public object Item { get; }
    }

    public delegate void ItemPropertyChangedEventHandler(object sender,
        ItemPropertyChangedEventArgs args);

}
