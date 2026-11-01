namespace ReFlex.Core.Common.Util
{
    /// <summary>
    /// Observable contact lifecycle. A second associated measurement confirms a tentative contact.
    /// Missing measurements produce Lost outputs up to the configured limit. After that the track
    /// ends and is omitted; a later contact receives a fresh ID, even at the same position.
    /// </summary>
    public enum InteractionTrackingState
    {
        Tentative,
        Confirmed,
        Lost
    }
}
