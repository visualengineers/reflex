namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// Data class containing a single Interaction and its associated Frame Id
    /// </summary>
    public class InteractionHistoryElement
    {
        /// <summary>
        /// The Id of the associated <see cref="InteractionFrame"/>
        /// </summary>
        public int FrameId { get; }
        
        /// <summary>
        /// The Interaction Data
        /// </summary>
        public Interaction Interaction { get; }

        /// <summary>
        /// Initializes the class with the values for FrameId and Interaction Data
        /// </summary>
        /// <param name="frameId">The Id of the associated <see cref="InteractionFrame"/></param>
        /// <param name="interaction">The Interaction Data</param>
        public InteractionHistoryElement(int frameId, Interaction interaction)
        {
            FrameId = frameId;
            Interaction = interaction;
        }
    }
}