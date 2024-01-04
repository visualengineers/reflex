using ReFlex.Core.Common.Components;

namespace Common.Test;

[TestFixture]
public class InteractionFrameHistoryTest
{
    /// <summary>
    /// Initializes the <see cref="InteractionFrame"/> with a random id (between 0 and 100) and a random number of interactions.
    /// Checks that all interactions are correctly stored in the created frame
    /// </summary>
    [TestCase]
    public void TestFrameInitializationWithInteractions()
    {
        var testData = new List<Interaction>();

        var rnd = new Random();

        var id = rnd.Next(100);
        
        for (var i = 0; i < rnd.Next(30); i++)
        {
            var interaction = new Interaction();
            interaction.TouchId = i;
            interaction.Time = DateTime.Now.Ticks;
            
            testData.Add(interaction);
        }

        var testFrame = new InteractionFrame(id, testData);
        
        Assert.That(testFrame, Is.Not.Null);
        Assert.That(testFrame.FrameId, Is.EqualTo(id));
        Assert.That(testFrame.Interactions, Is.Not.Empty);
        Assert.That(testFrame.Interactions, Has.Count.EqualTo(testData.Count));
        foreach (var interaction in testData)
        {
            Assert.That(testFrame.Interactions.Count(i => Equals(i.TouchId, interaction.TouchId)), Is.EqualTo(1));
        }
    }
    
    /// <summary>
    /// Initializes the <see cref="InteractionFrame"/> with a random id (between 0 and 100) and a random number of interactions.
    /// Checks that all interactions are correctly stored in the created frame
    /// </summary>
    [TestCase]
    public void TestFrameInitializationWithoutInteractions()
    {
        var rnd = new Random();

        var id = rnd.Next(100);
        
        var testFrame = new InteractionFrame(id);
        
        Assert.That(testFrame, Is.Not.Null);
        Assert.That(testFrame.FrameId, Is.EqualTo(id));
        Assert.That(testFrame.Interactions, Is.Not.Null);
        Assert.That(testFrame.Interactions, Is.Empty);
    }
    
    /// <summary>
    /// Initializes the <see cref="InteractionHistory"/> with a random id (between 0 and 100) and a random number of interactions.
    /// Checks that all interactions are correctly stored in the created frame
    /// </summary>
    [TestCase]
    public void TestHistoryInitialization()
    {
        var testData = new List<InteractionHistoryElement>();

        var rnd = new Random();

        var touchId = rnd.Next(100);
        
        for (var i = 0; i < rnd.Next(30); i++)
        {
            var interaction = new Interaction();
            interaction.TouchId = touchId;
            interaction.Time = DateTime.Now.Ticks;
            
            testData.Add(new InteractionHistoryElement(i, interaction));
        }

        var testHistory = new InteractionHistory(touchId, testData);
        
        Assert.That(testHistory, Is.Not.Null);
        Assert.That(testHistory.TouchId, Is.EqualTo(touchId));
        Assert.That(testHistory.Items, Is.Not.Empty);
        Assert.That(testHistory.Items, Has.Count.EqualTo(testData.Count));
        foreach (var frame in testData)
        {
            Assert.That(testHistory.Items.Count(i => Equals(i.FrameId, frame.FrameId)), Is.EqualTo(1));
        }
    }

     /// <summary>
     /// Tests if Conversion from List of <see cref="InteractionFrame"/> to <see cref="InteractionHistory"/> is correct.
     /// Checks that:
     /// - history items are ordered by touch id
     /// - history for each touch is ordered by descending frame id
     /// - history contains the correct frame associations and interactions 
     /// </summary>
    [TestCase]
    public void TestHistoryConversion()
     {
         var t1 = new Interaction { TouchId = 1 };
         var t2 = new Interaction { TouchId = 2 };
         var t3 = new Interaction { TouchId = 3 };
         var t4 = new Interaction { TouchId = 4 };
         var t5 = new Interaction { TouchId = 5 };
         var t6 = new Interaction { TouchId = 6 };
         
         // frame 1: 3 touches:  1 2 3
         // frame 2: 2 touches:  - 2 - - 5
         // frame 3: 1 touch:    - 2 - - 
         // frame 4: 3 touches:  1 - 3 4
         // frame 5: 2 touches:  - - - - 5 6
         // frame 6: 3 touches:  1 - - - - 6

         var f1 = new InteractionFrame(1, new List<Interaction> { t1, t2, t3 });
         var f2 = new InteractionFrame(2, new List<Interaction> { t2, t5 });
         var f3 = new InteractionFrame(3, new List<Interaction> { t2 });
         var f4 = new InteractionFrame(4, new List<Interaction> { t1, t3, t4 });
         var f5 = new InteractionFrame(5, new List<Interaction> { t5, t6 });
         var f6 = new InteractionFrame(6, new List<Interaction> { t1, t6 });

         var history = InteractionHistory.RetrieveHistoryFromInteractionFrames(new List<InteractionFrame>
         {
             f3, f1, f6, f4, f2, f5
         }).ToArray();
         
         // TouchId: 1
         Assert.That(history.Length, Is.EqualTo(6));
         Assert.That(history[0].TouchId, Is.EqualTo(1));
         Assert.That(history[0].Items.Count, Is.EqualTo(3));
         // Frame 6 comes first as frames are ordered in reverse (from newest to oldest frame)
         Assert.That(history[0].Items[0].FrameId, Is.EqualTo(6));
         Assert.That(history[0].Items[0].Interaction.TouchId, Is.EqualTo(1));
         Assert.That(history[0].Items[1].FrameId, Is.EqualTo(4));
         Assert.That(history[0].Items[1].Interaction.TouchId, Is.EqualTo(1));
         Assert.That(history[0].Items[2].FrameId, Is.EqualTo(1));
         Assert.That(history[0].Items[2].Interaction.TouchId, Is.EqualTo(1));
         
         // TouchId: 2
         Assert.That(history[1].TouchId, Is.EqualTo(2));
         Assert.That(history[1].Items.Count, Is.EqualTo(3));

         // frame 3, 2 and 1 contain touch id 2
         Assert.That(history[1].Items[0].FrameId, Is.EqualTo(3));
         Assert.That(history[1].Items[0].Interaction.TouchId, Is.EqualTo(2));
         Assert.That(history[1].Items[1].FrameId, Is.EqualTo(2));
         Assert.That(history[1].Items[1].Interaction.TouchId, Is.EqualTo(2));
         Assert.That(history[1].Items[2].FrameId, Is.EqualTo(1));
         Assert.That(history[1].Items[2].Interaction.TouchId, Is.EqualTo(2));
         
         // TouchId: 3
         Assert.That(history[2].TouchId, Is.EqualTo(3));
         Assert.That(history[2].Items.Count, Is.EqualTo(2));

         // frame 4 and 1 contain touch id 3
         Assert.That(history[2].Items[0].FrameId, Is.EqualTo(4));
         Assert.That(history[2].Items[0].Interaction.TouchId, Is.EqualTo(3));
         Assert.That(history[2].Items[1].FrameId, Is.EqualTo(1));
         Assert.That(history[2].Items[1].Interaction.TouchId, Is.EqualTo(3));
         
         // TouchId: 4
         Assert.That(history[3].TouchId, Is.EqualTo(4));
         Assert.That(history[3].Items.Count, Is.EqualTo(1));

         // frame 4 contain touch id 4
         Assert.That(history[3].Items[0].FrameId, Is.EqualTo(4));
         Assert.That(history[3].Items[0].Interaction.TouchId, Is.EqualTo(4));
         
         // TouchId: 5
         Assert.That(history[4].TouchId, Is.EqualTo(5));
         Assert.That(history[4].Items.Count, Is.EqualTo(2));

         // frame 5 and 2 contain touch id 5
         Assert.That(history[4].Items[0].FrameId, Is.EqualTo(5));
         Assert.That(history[4].Items[0].Interaction.TouchId, Is.EqualTo(5));
         Assert.That(history[4].Items[1].FrameId, Is.EqualTo(2));
         Assert.That(history[4].Items[1].Interaction.TouchId, Is.EqualTo(5));
         
         // TouchId: 5
         Assert.That(history[5].TouchId, Is.EqualTo(6));
         Assert.That(history[5].Items.Count, Is.EqualTo(2));

         // frame 6 and 5 contain touch id 6
         Assert.That(history[5].Items[0].FrameId, Is.EqualTo(6));
         Assert.That(history[5].Items[0].Interaction.TouchId, Is.EqualTo(6));
         Assert.That(history[5].Items[1].FrameId, Is.EqualTo(5));
         Assert.That(history[5].Items[1].Interaction.TouchId, Is.EqualTo(6));
     }
}