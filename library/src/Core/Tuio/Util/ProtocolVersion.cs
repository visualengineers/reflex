namespace ReFlex.Core.Tuio.Util
{
    /// <summary>
    /// Enumeration for distinguishing between protocol formats:
    /// * TUIO 1.1, <see cref="http://www.tuio.org/?specification"/> 
    /// * TUIO 2.0 <see cref="http://www.tuio.org/?tuio20"/>
    /// </summary>
    public enum ProtocolVersion
    {        
        TUIO_VERSION_1_1 = 0,
        TUIO_VERSION_2_0
    }
}
