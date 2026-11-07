namespace ReFlex.Server.Data.Config;

/// <summary>Motion uses raster units per second on a monotonic observation-time axis.</summary>
public class PredictionSettings
{
    public double PredictionHorizonSeconds { get; set; } = .05;
    public bool UseVelocityPrediction { get; set; } = true;
    public int NumFramesForPrediction { get; set; } = 3;
    public bool UseSecondDerivation { get; set; }
    public float SecondDerivationMagnitude { get; set; } = .5f;
}
