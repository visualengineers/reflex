using System;
using System.Collections.Generic;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// An interaction on an elastic display.
    /// </summary>
    public class Interaction
    {
        /// <summary>
        /// Id for tracking a touch point over time
        /// </summary>
        public int TouchId { get; set; } = -1;

        /// <summary>
        /// Gets the position.
        /// </summary>
        /// <value>
        /// The position.
        /// </value>
        public Point3 Position { get; set; } = new Point3();

        /// <summary>
        /// Gets the type.
        /// </summary>
        /// <value>
        /// The type.
        /// </value>
        public InteractionType Type { get; set; } = 0;

        /// <summary>
        /// description of extremum to distinguish interactions from extremums between two interactions.
        /// </summary>
        public ExtremumDescription ExtremumDescription { get; set; } = new ExtremumDescription
        {
            Type = ExtremumType.Undefined,
            NumFittingPoints = 0,
            PercentageFittingPoints = 0
        };

        /// <summary>
        /// Gets or sets the confidence.
        /// </summary>
        /// <value>
        /// The confidence.
        /// </value>
        public float Confidence { get; set; } = 0;

        /// <summary>
        /// Gets the time.
        /// </summary>
        /// <value>
        /// The time.
        /// </value>
        public long Time { get; set; } = 0;

        /// <summary>
        /// Just for json serialization !
        /// </summary>
        public Interaction()
        {
            Time = DateTime.Now.Ticks;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Interaction"/> class.
        /// </summary>
        public Interaction(Point3 position, Interaction source)
        {
            Position = position;
            Type = source.Type;
            Confidence = source.Confidence;
            ExtremumDescription = source.ExtremumDescription;
            Time = source.Time;
            TouchId = source.TouchId;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Interaction"/> struct.
        /// </summary>
        /// <param name="position">The position.</param>
        /// <param name="type">The type.</param>
        /// <param name="confidence">The confidence.</param>
        public Interaction(Point3 position, InteractionType type, float confidence)
        {
            Position = position;
            Type = type;
            Confidence = confidence;
            Time = DateTime.Now.Ticks;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Interaction"/> class.
        /// </summary>
        /// <param name="source">The source.</param>
        public Interaction(Interaction source)
        {
            TouchId = source.TouchId;
            Position = source.Position;
            Type = source.Type;
            ExtremumDescription = source?.ExtremumDescription ?? new ExtremumDescription();
            Confidence = source.Confidence;
            Time = source.Time;
        }

        /// <summary>
        /// Returns [this] as a list.
        /// </summary>
        /// <returns></returns>
        public IList<Interaction> AsList() => new List<Interaction> { this };

        /// <summary>
        /// Returns a <see cref="System.String" /> that represents this instance.
        /// </summary>
        /// <returns>
        /// A <see cref="System.String" /> that represents this instance.
        /// </returns>
        public override string ToString() => $"TouchId: {TouchId}, Position: {Position}, Type: {Type}, Confidence: {Confidence}, Time: {Time}";
    }
}
