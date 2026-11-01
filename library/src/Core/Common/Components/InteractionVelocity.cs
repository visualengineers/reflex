using System;

namespace ReFlex.Core.Common.Components;

/// <summary>
/// Motion in raster coordinates per second (Z is normalized depth); acceleration is units/s².
/// Both forecasts target PredictionTimestampSeconds. MeasuredPosition and SmoothedPosition belong
/// to FrameId; a Lost contact retains its last real measurement. Diagnostics are never fed
/// back as measurements. Derivatives are evaluated at the last measurement time.
/// </summary>
public class InteractionVelocity
{
    public int TouchId { get; set; }
    public int FrameId { get; set; }
    public int LastMeasuredFrameId { get; set; }
    public double TimestampSeconds { get; set; }
    public double LastMeasuredTimestampSeconds { get; set; }
    public double PredictionTimestampSeconds { get; set; }
    public double PredictionHorizonSeconds { get; set; }
    public float Confidence { get; set; }
    public int SampleCount { get; set; }
    public bool IsPredicted { get; set; }
    public bool IsPublished { get; set; }
    public string SuppressionReason { get; set; } = "";
    public bool UseSecondDerivation { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public Point3 MeasuredPosition { get; set; } = new();
    public Point3 SmoothedPosition { get; set; } = new();
    public Point3 MatchingPosition { get; set; } = new();
    public Point3 FirstDerivation { get; set; } = new();
    public Point3 SecondDerivation { get; set; } = new();
    public Point3 PredictedPositionBasic { get; set; } = new();
    public Point3 PredictedPositionAdvanced { get; set; } = new();

    public InteractionVelocity() { }

    public InteractionVelocity(int touchId, Point3 position, Point3 firstDerivation = null,
        Point3 secondDerivation = null, float secondDerivationMagnitude = .5f)
    {
        TouchId = touchId;
        Update(position, firstDerivation ?? new Point3(), secondDerivation ?? new Point3(), secondDerivationMagnitude);
    }

    /// <summary>h is seconds. p(t+h) = p(t) + v(t) h + magnitude a(t) h²; .5 gives constant acceleration.</summary>
    public void Update(Point3 position, Point3 firstDerivation, Point3 secondDerivation,
        float secondDerivationMagnitude = .5f, float horizon = 1)
    {
        if (!float.IsFinite(horizon) || horizon < 0)
            throw new ArgumentOutOfRangeException(nameof(horizon));
        if (!float.IsFinite(secondDerivationMagnitude) || secondDerivationMagnitude < 0)
            throw new ArgumentOutOfRangeException(nameof(secondDerivationMagnitude));
        MeasuredPosition = (Point3)position.Copy();
        FirstDerivation = (Point3)firstDerivation.Copy();
        SecondDerivation = (Point3)secondDerivation.Copy();
        PredictedPositionBasic = position + firstDerivation * horizon;
        PredictedPositionAdvanced = PredictedPositionBasic + secondDerivation * (secondDerivationMagnitude * horizon * horizon);
    }
}
