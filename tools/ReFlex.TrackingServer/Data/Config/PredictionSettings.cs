namespace TrackingServer.Data.Config;

public class PredictionSettings
{
    public bool UseVelocityPrediction { get; set; } = true;

    public int NumFramesForPrediction { get; set; } = 2;

    public bool UseSecondDerivation { get; set; } = false;

    public float SecondDerivationMagnitude { get; set; } = 0.5f;

    public bool FilterPointsByVelocity { get; set; } = true;

    public float VelocityFilterThreshold { get; set; } = 2.5f;

    public PredictionSettings()
    {
    }


}