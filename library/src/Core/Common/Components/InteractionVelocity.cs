using System.Data;

namespace ReFlex.Core.Common.Components;

public class InteractionVelocity
{
    public int TouchId { get; }
    public Point3 FirstDerivation { get; }

    public Point3 SecondDerivation { get; }

    public Point3 PredictedPositionBasic { get; private set; }

    public Point3 PredictedPositionAdvanced { get; private set; }

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

    public void Update(Point3 position, Point3 firstDerivation, Point3 secondDerivation, float secondDerivationMagnitude = 0.5f)
    {
        PredictedPositionBasic = ComputePredictedPositionBasic(position, firstDerivation);
        PredictedPositionAdvanced = ComputePredictedPositionAdvanced(position,firstDerivation, secondDerivation, secondDerivationMagnitude);
    }

    private Point3 ComputePredictedPositionBasic(Point3 position, Point3 firstDerivation)
    {
        return position + firstDerivation;
    }

    private Point3 ComputePredictedPositionAdvanced(Point3 position, Point3 firstDerivation, Point3 secondDerivation, float secondDerivationMagnitude = 0.5f)
    {
        return position + FirstDerivation + SecondDerivation * secondDerivationMagnitude;
    }

}
