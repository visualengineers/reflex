using System;
using System.ComponentModel;
using System.Globalization;

namespace ReFlex.Core.Common.Util
{
    /// <summary>
    /// Converts a <see cref="StreamParameter"/> to/from a <see cref="string"/>.
    /// </summary>
    /// <seealso cref="System.ComponentModel.TypeConverter" />
    /// <inheritdoc />
    public class StreamParameterConverter : TypeConverter
    {
        #region methods

        /// <summary>
        /// Gibt zurück, ob dieser Konverter ein Objekt vom angegebenen Typ unter Verwendung des angegebenen Kontexts in den Typ dieses Konverters konvertieren kann.
        /// </summary>
        /// <param name="context">Ein <see cref="T:System.ComponentModel.ITypeDescriptorContext" />, der einen Formatierungskontext bereitstellt.</param>
        /// <param name="sourceType">Ein <see cref="T:System.Type" /> den darstellt, aus dem konvertiert werden soll.</param>
        /// <returns>
        ///   <see langword="true" />, wenn dieser Konverter die Konvertierung durchführen kann, andernfalls <see langword="false" />.
        /// </returns>
        /// <inheritdoc />
        public override bool CanConvertFrom(ITypeDescriptorContext context, Type sourceType)
        {
            return sourceType == typeof(string);
        }

        /// <summary>
        /// Konvertiert das angegebene Objekt unter Verwendung des angegebenen Kontexts und der angegebenen Kulturinformationen in den Typ dieses Konverters.
        /// </summary>
        /// <param name="context">Ein <see cref="T:System.ComponentModel.ITypeDescriptorContext" />, der einen Formatierungskontext bereitstellt.</param>
        /// <param name="culture">Das als aktuelle Kultur zu verwendende <see cref="T:System.Globalization.CultureInfo" />-Element.</param>
        /// <param name="value">Die zu konvertierende <see cref="T:System.Object" />.</param>
        /// <returns>
        /// Ein <see cref="T:System.Object" /> das den konvertierten Wert darstellt.
        /// </returns>
        /// <inheritdoc />
        public override object ConvertFrom(
            ITypeDescriptorContext context, CultureInfo culture, object value)
        {
            if (!(value is string s))
                return base.ConvertFrom(context, culture, value);

            var parts = s.Split(',');
            var width = Convert.ToInt32(parts[0]);
            var height = Convert.ToInt32(parts[1]);
            var framerate = Convert.ToInt32(parts[2]);
            return new StreamParameter(width, height, framerate);
        }

        /// <summary>
        /// Konvertiert das angegebene Wertobjekt unter Verwendung des angegebenen Kontexts und der angegebenen Kulturinformationen in den angegebenen Typ.
        /// </summary>
        /// <param name="context">Ein <see cref="T:System.ComponentModel.ITypeDescriptorContext" />, der einen Formatierungskontext bereitstellt.</param>
        /// <param name="culture">Ein <see cref="T:System.Globalization.CultureInfo" />.
        /// Wenn <see langword="null" /> übergeben wird, wird von der aktuellen Kultur ausgegangen.</param>
        /// <param name="value">Die zu konvertierende <see cref="T:System.Object" />.</param>
        /// <param name="destinationType">Die <see cref="T:System.Type" /> zum Konvertieren der <paramref name="value" /> Parameter an.</param>
        /// <returns>
        /// Ein <see cref="T:System.Object" /> das den konvertierten Wert darstellt.
        /// </returns>
        /// <inheritdoc />
        public override object ConvertTo(
            ITypeDescriptorContext context, CultureInfo culture,
            object value, Type destinationType)
        {
            if (destinationType != typeof(string))
                return base.ConvertTo(context, culture, value, destinationType);

            if (value is StreamParameter config)
                return $"{config.Width},{config.Height},{config.Framerate}";

            return "";
        }

        #endregion
    }
}
