using System.Collections.Generic;
using System.Linq;

namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// Data class containing a List of <see cref="Interaction"/> associated with a specific <see cref="TouchId"/>
    /// </summary>
    public class InteractionHistory
    {
        /// <summary>
        /// The TouchId associated with the Interactions of past <see cref="InteractionFrame"/>s 
        /// </summary>
        public int TouchId { get; }

        /// <summary>
        /// A List of past Interactions associated with the provided <see cref="TouchId"/>
        /// Contains one Element for each frame in which a touch with the associated <see cref="TouchId"/> was registered.
        /// </summary>
        public List<InteractionHistoryElement> Items { get; }

        /// <summary>
        /// Initializes the data class. 
        /// </summary>
        /// <param name="touchId">The TouchId associated with the Interactions of past <see cref="InteractionFrame"/>s </param>
        /// <param name="items">List of past Interactions associated with the provided touchId</param>
        public InteractionHistory(int touchId, List<InteractionHistoryElement> items)
        {
            Items = items;
            TouchId = touchId;
        }

        /// <summary>
        /// Converts Interaction Data mapped by <see cref="InteractionFrame"/>(and associated <see cref="InteractionFrame.FrameId"/> into Data mapped by <see cref="Interaction"/> and their associated <see cref="Interaction.TouchId"/> 
        /// </summary>
        /// <param name="frames">List of <see cref="InteractionFrame"/> with (calibrated) interaction data</param>
        /// <returns>History for each identified touch id.</returns>
        public static IOrderedEnumerable<InteractionHistory> RetrieveHistoryFromInteractionFrames(
            IEnumerable<InteractionFrame> frames)
        {
            var interactionFrames = frames.ToList();
            var ids = interactionFrames
                .SelectMany(frame => frame.Interactions.Select(interaction => interaction.TouchId)).Distinct().ToList();

            var result = new List<InteractionHistory>();

            ids.ForEach(id =>
            {
                var elements = interactionFrames.OrderByDescending(frame => frame.FrameId)
                    .Select(frame => new InteractionHistoryElement(frame.FrameId,
                        frame.Interactions.FirstOrDefault(interaction => Equals(interaction.TouchId, id))))
                    .Where(elem => elem.Interaction != null).ToList();
                if (elements.Count > 0)
                {
                    result.Add(new InteractionHistory(id, elements));
                }
            });

            return result.OrderBy(history => history.TouchId);
        }
    }
}