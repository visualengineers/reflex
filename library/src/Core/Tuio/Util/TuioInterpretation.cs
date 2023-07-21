namespace ReFlex.Core.Tuio.Util
{
    /// <summary>
    /// Specify how to translate the ReFlex interaction. Supported are 2.5D Points (tuio/25Dobj or tuoi2/ptr) or 3D coordinates (tuio/3Dobj or tuoi2/p3d))
    /// </summary>
    public enum TuioInterpretation
    {
        TouchPoint2DwithPressure = 0,
        Point3D = 1
    }
}
