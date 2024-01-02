using System.Collections.Generic;

namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// Data class containing all touches that have been registered on a specific depth frame (or in a specific time frame)
    /// </summary>
    public class InteractionFrame
    {
        /// <summary>
        /// the Identifier for the Frame, typically a sequentially counting number
        /// </summary>
        public int FrameId { get; private set; }

        /// <summary>
        /// Interactions register4ed in the given frame
        /// </summary>
        public List<Interaction> Interactions { get; } = new List<Interaction>();

        /// <summary>
        /// Initializes the data class with an empty List of <see cref="Interaction"/>
        /// </summary>
        /// <param name="id">Id of the frame</param>
        public InteractionFrame(int id)
        {
            FrameId = id;
        }

        /// <summary>
        /// Initializes the data class with an the provided List of <see cref="Interaction"/>
        /// </summary>
        /// <param name="id">Id of the frame</param>
        /// <param name="interactions">The Interactions that have been registered in this frame</param>
        public InteractionFrame(int id, List<Interaction> interactions) : this(id)
        {
            Interactions = interactions;
        }
    }
}