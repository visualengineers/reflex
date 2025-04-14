using System.Data;

namespace ReFlex.Core.Common.Components;

public class InteractionVelocity
{
    public int TouchId { get; set; }
    public Point3 FirstDerivation { get; set; }

    public Point3 SecondDerivation { get; set; }

    public Point3 PredictedPositionBasic { get; set; }

    public Point3 PredictedPositionAdvanced { get; set; }

    /// <summary>
    /// Just for json serialization !
    /// </summary>
    public InteractionVelocity() :
        this(-1, new Point3())
    {
    }

    public InteractionVelocity(int touchId, Point3 position) :
        this(touchId, position, new Point3(0f, 0f, 0f))
    {
    }

    /// <summary>
    /// Initializes all values and computes the predicted position (if no second derivation is available)
    /// </summary>
    /// <param name="touchId"></param>
    /// <param name="position"></param>
    /// <param name="firstDerivation"></param>
    /// <param name="secondDerivationMagnitude"></param>
    public InteractionVelocity(int touchId, Point3 position, Point3 firstDerivation, float secondDerivationMagnitude = 0.5f) :
        this(touchId, position, firstDerivation, new Point3(0f, 0f, 0f), secondDerivationMagnitude)
    {
    }


    public InteractionVelocity(int touchId, Point3 position, Point3 firstDerivation, Point3 secondDerivation, float secondDerivationMagnitude = 0.5f)
    {
        TouchId = touchId;
        FirstDerivation = firstDerivation;
        SecondDerivation = secondDerivation;

        Update(position, firstDerivation, secondDerivation, secondDerivationMagnitude);
    }

    public InteractionVelocity(int touchId, Point3 firstDerivation, Point3 secondDerivation, Point3 predictedPositionBasic, Point3 predictedPositionAdvanced)
    {
        TouchId = touchId;
        FirstDerivation = firstDerivation;
        SecondDerivation = secondDerivation;
        PredictedPositionBasic = predictedPositionBasic;
        PredictedPositionAdvanced = predictedPositionAdvanced;
    }

    public void Update(Point3 position, Point3 firstDerivation, Point3 secondDerivation, float secondDerivationMagnitude = 0.5f)
    {
        PredictedPositionBasic = ComputePredictedPositionBasic(position, firstDerivation);
        PredictedPositionAdvanced = ComputePredictedPositionAdvanced(position,firstDerivation, secondDerivation, secondDerivationMagnitude);
    }

    private Point3 ComputePredictedPositionBasic(Point3 position, Point3 firstDerivation)
    {
        return new Point3(position.X + firstDerivation.X, position.Y + firstDerivation.Y, position.Z + firstDerivation.Z);
    }

    private Point3 ComputePredictedPositionAdvanced(Point3 position, Point3 firstDerivation, Point3 secondDerivation, float secondDerivationMagnitude = 1f)
    {
        var sum = 1f + secondDerivationMagnitude;
        return new Point3(position.X + (firstDerivation.X + secondDerivation.X * secondDerivationMagnitude) / sum,
            position.Y + (firstDerivation.Y + secondDerivation.Y * secondDerivationMagnitude) / sum,
            position.Z + (firstDerivation.Z + secondDerivation.Z * secondDerivationMagnitude) / sum);
    }

}
