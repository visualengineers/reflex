namespace ReFlex.Core.Tuio.Util
{
    /// <summary>
    /// enum to distiguish which protocol to use for TUIO OSC communication.
    /// TUIO supports UDP, TCP and Websockets
    /// </summary>
    public enum TransportProtocol
    {
        Udp = 0,
        Tcp = 1,
        WebSocket = 2
    }
}
