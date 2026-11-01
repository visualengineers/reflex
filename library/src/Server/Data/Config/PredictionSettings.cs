namespace ReFlex.Server.Data.Config;

/// <summary>Motion uses raster units per processed frame, not wall-clock seconds.</summary>
public class PredictionSettings
{
    public bool UseVelocityPrediction { get; set; } = true;
    public int NumFramesForPrediction { get; set; } = 3;
    public bool UseSecondDerivation { get; set; }
    public float SecondDerivationMagnitude { get; set; } = .5f;
}
