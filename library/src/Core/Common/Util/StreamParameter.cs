using System;
using System.ComponentModel;
using System.Configuration;
using Newtonsoft.Json;

namespace ReFlex.Core.Common.Util
{
    /// <inheritdoc />
    /// <summary>
    /// </summary>
    [TypeConverter(typeof(StreamParameterConverter))]
    [SettingsSerializeAs(SettingsSerializeAs.String)]
    [JsonConverter(typeof(DisableTypeConverterJsonConverter<StreamParameter>))]
    public class StreamParameter : IEquatable<StreamParameter>
    {
        /// <summary>
        /// The name to distinguish similar Parameters
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// The horizontal resolution
        /// </summary>
        public int Width { get; }

        /// <summary>
        /// The vertical resolution
        /// </summary>
        public int Height { get; }

        /// <summary>
        /// The frame rate
        /// </summary>
        public int Framerate { get; }

        public DepthImageFormat Format { get; }

        /// <summary>
        /// Gets the description.
        /// </summary>
        /// <value>
        /// The description.
        /// </value>
        [JsonIgnore]
        public string Description => ToString();

        /// <summary>
        /// Initializes a new instance of the <see cref="StreamParameter"/> class.
        /// </summary>
        /// <param name="width">The horizontal resolution.</param>
        /// <param name="height">The vertical resolution.</param>
        /// <param name="framerate">The frame rate.</param>
        /// <param name="name">(Optional) name, to distinguish different parameters with equal specification (e.g. for recording multiple streams with the same resolution)</param>
        public StreamParameter(int width, int height, int framerate, DepthImageFormat format = DepthImageFormat.Rgb24bpp, string name = "")
        {
            Name = name;
            Width = width;
            Height = height;
            Framerate = framerate;
            Format = format;
            Name = name;
        }

        #region methods

        /// <summary>
        /// Gibt an, ob das aktuelle Objekt gleich einem anderen Objekt des gleichen Typs ist.
        /// </summary>
        /// <param name="other">Ein Objekt, das mit diesem Objekt verglichen werden soll.</param>
        /// <returns>
        ///   <see langword="true" />, wenn das aktuelle Objekt gleich dem <paramref name="other" />-Parameter ist, andernfalls <see langword="false" />.
        /// </returns>
        /// <inheritdoc />
        public bool Equals(StreamParameter other)
            => other != null && other.Name == Name && Width == other.Width && Height == other.Height && Framerate == other.Framerate;

        /// <summary>
        /// Returns a <see cref="string" /> that represents [this] instance.
        /// </summary>
        /// <returns>
        /// A <see cref="string" /> that represents [this] instance.
        /// </returns>
        public override string ToString()
        {
            var desc = $"{Width} x {Height} x {Framerate}";
            if (!string.IsNullOrWhiteSpace(Name))
                desc = $"{Name}: ({desc})";

            return desc;
        }

        #endregion
    }
}
