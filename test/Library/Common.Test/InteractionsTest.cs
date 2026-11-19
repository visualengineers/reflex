using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace Common.Test;

public class InteractionsTest
{
    /// <summary>Both copy constructors own their mutable data and preserve tracking metadata.</summary>
    [TestCase(false)]
    [TestCase(true)]
    public void CopiesAreIndependentSnapshots(bool replacePosition)
    {
        var source = new Interaction
        {
            TouchId = 42,
            TrackingState = InteractionTrackingState.Lost,
            Time = 123,
            Position = new Point3(1, 2, 3) { IsValid = false, IsFiltered = true },
            ExtremumDescription = new ExtremumDescription { NumFittingPoints = 7 }
        };
        var position = new Point3(4, 5, 6) { IsValid = false, IsFiltered = true };
        var copy = replacePosition ? new Interaction(position, source) : new Interaction(source);
        copy.Position.X = 100;
        copy.ExtremumDescription.NumFittingPoints = 99;
        Assert.Multiple(() =>
        {
            Assert.That(source.Position.X, Is.EqualTo(1));
            Assert.That(position.X, Is.EqualTo(4));
            Assert.That(source.ExtremumDescription.NumFittingPoints, Is.EqualTo(7));
            Assert.That(copy.Position.IsValid, Is.False);
            Assert.That(copy.Position.IsFiltered, Is.True);
            Assert.That(copy.TouchId, Is.EqualTo(42));
            Assert.That(copy.Time, Is.EqualTo(123));
            Assert.That(copy.TrackingState, Is.EqualTo(InteractionTrackingState.Lost));
        });
    }

    [SetUp]
    public void Setup()
    {
    }

    /// <summary>
    /// Test that <see cref="Interaction"/> is initialized with default values when using standard constructor.
    /// </summary>
    [Test]
    public void TestInitializationWithDefaults()
    {
        var interaction = new Interaction();

        var now = DateTime.Now;

        Assert.That(interaction.TouchId, Is.EqualTo(-1));
        Assert.That(interaction.Position.X, Is.EqualTo(0));
        Assert.That(interaction.Position.Y, Is.EqualTo(0));
        Assert.That(interaction.Position.Z, Is.EqualTo(0));
        Assert.That(interaction.Position.IsValid, Is.EqualTo(true));
        Assert.That(interaction.Position.IsFiltered, Is.EqualTo(false));
        Assert.That(interaction.Type, Is.EqualTo(InteractionType.None));
        Assert.That(interaction.ExtremumDescription.Type, Is.EqualTo(ExtremumType.Undefined));
        Assert.That(interaction.ExtremumDescription.NumFittingPoints, Is.EqualTo(0));
        Assert.That(interaction.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(0));
        Assert.That(interaction.Confidence, Is.EqualTo(0));
        Assert.That(new DateTime(interaction.Time), Is.EqualTo(now).Within(1).Seconds);
    }
    
    /// <summary>
    /// Test that <see cref="Interaction"/> copies all values except position (especially Time should NOT be updated).
    /// </summary>
    [Test]
    public void TestInitializationWithUpdatedPosition()
    {
        var max = 100;

        var srcTime = DateTime.Now - TimeSpan.FromHours(new Random().Next(max) + 10);

        var posOld = new Point3(
            new Random().Next(max) / (float)max,
            new Random().Next(max) / (float)max,
            2f * (new Random().Next(max) / (float)max) - 1f
        );
        
        var posUpdated = new Point3(
            new Random().Next(max) / (float)max,
            new Random().Next(max) / (float)max,
            2f * (new Random().Next(max) / (float)max) - 1f
        );

        posUpdated.IsFiltered = true;
        posUpdated.IsValid = false;

        var extremum = new ExtremumDescription
        {
            Type = ExtremumType.Minimum,
            NumFittingPoints = new Random().Next(max),
            PercentageFittingPoints = new Random().Next(max) / (float)max
        };

        var touchId = new Random().Next(max);
        var confidence = new Random().Next(max);

        var src = new Interaction
        {
            Position = posOld,
            Confidence = confidence,
            Time = srcTime.Ticks,
            ExtremumDescription = extremum,
            Type = InteractionType.Push,
            TouchId = touchId
        };
        
        Assert.That(src.TouchId, Is.EqualTo(touchId));
        Assert.That(src.Position.X, Is.EqualTo(posOld.X));
        Assert.That(src.Position.Y, Is.EqualTo(posOld.Y));
        Assert.That(src.Position.Z, Is.EqualTo(posOld.Z));
        Assert.That(src.Position.IsValid, Is.EqualTo(true));
        Assert.That(src.Position.IsFiltered, Is.EqualTo(false));
        Assert.That(src.Type, Is.EqualTo(InteractionType.Push));
        Assert.That(src.ExtremumDescription.Type, Is.EqualTo(extremum.Type));
        Assert.That(src.ExtremumDescription.NumFittingPoints, Is.EqualTo(extremum.NumFittingPoints));
        Assert.That(src.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(extremum.PercentageFittingPoints));
        Assert.That(new DateTime(src.Time), Is.EqualTo(srcTime));
        Assert.That(src.Confidence, Is.EqualTo(confidence));
        
        
        var interaction = new Interaction(posUpdated, src);

        Assert.That(interaction.TouchId, Is.EqualTo(touchId));
        Assert.That(interaction.Position.X, Is.EqualTo(posUpdated.X));
        Assert.That(interaction.Position.Y, Is.EqualTo(posUpdated.Y));
        Assert.That(interaction.Position.Z, Is.EqualTo(posUpdated.Z));
        Assert.That(interaction.Position.IsValid, Is.EqualTo(false));
        Assert.That(interaction.Position.IsFiltered, Is.EqualTo(true));
        Assert.That(interaction.Type, Is.EqualTo(InteractionType.Push));
        Assert.That(interaction.ExtremumDescription.Type, Is.EqualTo(extremum.Type));
        Assert.That(interaction.ExtremumDescription.NumFittingPoints, Is.EqualTo(extremum.NumFittingPoints));
        Assert.That(interaction.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(extremum.PercentageFittingPoints));
        Assert.That(new DateTime(interaction.Time), Is.EqualTo(srcTime));
        Assert.That(interaction.Confidence, Is.EqualTo(confidence));
    }
    
    /// <summary>
    /// Test that <see cref="Interaction"/> copies all values (especially Time should NOT be updated).
    /// </summary>
    [Test]
    public void TestInitializationByCopy()
    {
        var max = 100;

        var srcTime = DateTime.Now - TimeSpan.FromHours(new Random().Next(max) + 10);

        var position = new Point3(
            new Random().Next(max) / (float)max,
            new Random().Next(max) / (float)max,
            2f * (new Random().Next(max) / (float)max) - 1f
        );
        
        var extremum = new ExtremumDescription
        {
            Type = ExtremumType.Minimum,
            NumFittingPoints = new Random().Next(max),
            PercentageFittingPoints = new Random().Next(max) / (float)max
        };

        var touchId = new Random().Next(max);
        var confidence = new Random().Next(max);

        var src = new Interaction
        {
            Position = position,
            Confidence = confidence,
            Time = srcTime.Ticks,
            ExtremumDescription = extremum,
            Type = InteractionType.Push,
            TouchId = touchId
        };
        
        Assert.That(src.TouchId, Is.EqualTo(touchId));
        Assert.That(src.Position.X, Is.EqualTo(position.X));
        Assert.That(src.Position.Y, Is.EqualTo(position.Y));
        Assert.That(src.Position.Z, Is.EqualTo(position.Z));
        Assert.That(src.Position.IsValid, Is.EqualTo(true));
        Assert.That(src.Position.IsFiltered, Is.EqualTo(false));
        Assert.That(src.Type, Is.EqualTo(InteractionType.Push));
        Assert.That(src.ExtremumDescription.Type, Is.EqualTo(extremum.Type));
        Assert.That(src.ExtremumDescription.NumFittingPoints, Is.EqualTo(extremum.NumFittingPoints));
        Assert.That(src.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(extremum.PercentageFittingPoints));
        Assert.That(new DateTime(src.Time), Is.EqualTo(srcTime));
        Assert.That(src.Confidence, Is.EqualTo(confidence));
        
        
        var interaction = new Interaction(src);

        Assert.That(interaction.TouchId, Is.EqualTo(touchId));
        Assert.That(interaction.Position.X, Is.EqualTo(position.X));
        Assert.That(interaction.Position.Y, Is.EqualTo(position.Y));
        Assert.That(interaction.Position.Z, Is.EqualTo(position.Z));
        Assert.That(interaction.Position.IsValid, Is.EqualTo(true));
        Assert.That(interaction.Position.IsFiltered, Is.EqualTo(false));
        Assert.That(interaction.Type, Is.EqualTo(InteractionType.Push));
        Assert.That(interaction.ExtremumDescription.Type, Is.EqualTo(extremum.Type));
        Assert.That(interaction.ExtremumDescription.NumFittingPoints, Is.EqualTo(extremum.NumFittingPoints));
        Assert.That(interaction.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(extremum.PercentageFittingPoints));
        Assert.That(new DateTime(interaction.Time), Is.EqualTo(srcTime));
        Assert.That(interaction.Confidence, Is.EqualTo(confidence));
    }

    /// <summary>
    /// Test that <see cref="Interaction"/> copies als values except position (especially Time should NOT be updated).
    /// </summary>
    [Test]
    public void TestInitializationNewInteractionFromPosition()
    {
        var max = 100;

        var now = DateTime.Now;

        var position = new Point3(
            new Random().Next(max) / (float)max,
            new Random().Next(max) / (float)max,
            2f * (new Random().Next(max) / (float)max) - 1f
        );


        var confidence = new Random().Next(max);

        var interaction = new Interaction(position, InteractionType.Pull, confidence);


        Assert.That(interaction.TouchId, Is.EqualTo(-1));
        Assert.That(interaction.Position.X, Is.EqualTo(position.X));
        Assert.That(interaction.Position.Y, Is.EqualTo(position.Y));
        Assert.That(interaction.Position.Z, Is.EqualTo(position.Z));
        Assert.That(interaction.Position.IsValid, Is.EqualTo(true));
        Assert.That(interaction.Position.IsFiltered, Is.EqualTo(false));
        Assert.That(interaction.Type, Is.EqualTo(InteractionType.Pull));
        Assert.That(interaction.ExtremumDescription.Type, Is.EqualTo(ExtremumType.Undefined));
        Assert.That(interaction.ExtremumDescription.NumFittingPoints, Is.EqualTo(0));
        Assert.That(interaction.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(0));
        Assert.That(new DateTime(interaction.Time), Is.EqualTo(now).Within(1).Seconds);
        Assert.That(interaction.Confidence, Is.EqualTo(confidence));
    }

    [Test]
    public void TestConversionToList()
    {
        var max = 100;

        var srcTime = DateTime.Now - TimeSpan.FromHours(new Random().Next(max) + 10);

        var position = new Point3(
            new Random().Next(max) / (float)max,
            new Random().Next(max) / (float)max,
            2f * (new Random().Next(max) / (float)max) - 1f
        );

        var extremum = new ExtremumDescription
        {
            Type = ExtremumType.Minimum,
            NumFittingPoints = new Random().Next(max),
            PercentageFittingPoints = new Random().Next(max) / (float)max
        };

        var touchId = new Random().Next(max);
        var confidence = new Random().Next(max);

        var src = new Interaction
        {
            Position = position,
            Confidence = confidence,
            Time = srcTime.Ticks,
            ExtremumDescription = extremum,
            Type = InteractionType.Push,
            TouchId = touchId
        };

        var list = src.AsList();

        Assert.That(list, Has.Count.EqualTo(1));
        
        var element = list[0];
        
        Assert.That(element.TouchId, Is.EqualTo(touchId));
        Assert.That(element.Position.X, Is.EqualTo(position.X));
        Assert.That(element.Position.Y, Is.EqualTo(position.Y));
        Assert.That(element.Position.Z, Is.EqualTo(position.Z));
        Assert.That(element.Position.IsValid, Is.EqualTo(true));
        Assert.That(element.Position.IsFiltered, Is.EqualTo(false));
        Assert.That(element.Type, Is.EqualTo(InteractionType.Push));
        Assert.That(element.ExtremumDescription.Type, Is.EqualTo(extremum.Type));
        Assert.That(element.ExtremumDescription.NumFittingPoints, Is.EqualTo(extremum.NumFittingPoints));
        Assert.That(element.ExtremumDescription.PercentageFittingPoints, Is.EqualTo(extremum.PercentageFittingPoints));
        Assert.That(new DateTime(element.Time), Is.EqualTo(srcTime));
        Assert.That(element.Confidence, Is.EqualTo(confidence));
    }

    /// <summary>
    /// Test ToString() method returns correct values
    /// </summary>
    [Test]
    public void TestStringRepresentation()
    {
        var max = 100;

        var srcTime = DateTime.Now - TimeSpan.FromHours(new Random().Next(max) + 10);

        var position = new Point3(
            new Random().Next(max) / (float)max,
            new Random().Next(max) / (float)max,
            2f * (new Random().Next(max) / (float)max) - 1f
        );

        var extremum = new ExtremumDescription
        {
            Type = ExtremumType.Minimum,
            NumFittingPoints = new Random().Next(max),
            PercentageFittingPoints = new Random().Next(max) / (float)max
        };

        var touchId = new Random().Next(max);
        var confidence = new Random().Next(max);

        var src = new Interaction
        {
            Position = position,
            Confidence = confidence,
            Time = srcTime.Ticks,
            ExtremumDescription = extremum,
            Type = InteractionType.Push,
            TouchId = touchId
        };

        var result = src.ToString();
        
        Assert.That(string.IsNullOrWhiteSpace(result), Is.False);

        if (string.IsNullOrWhiteSpace(result))
            return;
        
        Assert.That(result.Contains($"{src.TouchId}"), Is.True);
        Assert.That(result.Contains($"{src.Position}"), Is.True);
        Assert.That(result.Contains($"{src.Type}"), Is.True);
        Assert.That(result.Contains($"{src.Confidence}"), Is.True);
        

    }
}