using Castle.Core;
using Common.Test.Mock;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;

namespace Common.Test;

[TestFixture]
public class PerformanceAggregatorTest
{
    [Test]
    public void MeasurePerformance_SetToTrue_AllReportersMeasurePerformanceSetToTrue()
    {
        // Arrange
        var aggregator = new PerformanceAggregator();
        var reporter1 = new MockPerformanceReporter();
        var reporter2 = new MockPerformanceReporter();

        // Act
        aggregator.RegisterReporter(reporter1);
        aggregator.RegisterReporter(reporter2);
        aggregator.MeasurePerformance = true;

        // Assert
        Assert.IsTrue(reporter1.MeasurePerformance);
        Assert.IsTrue(reporter2.MeasurePerformance);
    }

    [Test]
    public void RegisterReporter_NullReporter_NoExceptionThrown()
    {
        // Arrange
        var aggregator = new PerformanceAggregator();

        // Act & Assert
        Assert.DoesNotThrow(() => aggregator.RegisterReporter(null));
    }
    
    [Test]
    public void UnregisterReporter_NullReporter_NoExceptionThrown()
    {
        // Arrange
        var aggregator = new PerformanceAggregator();

        // Act & Assert
        Assert.DoesNotThrow(() => aggregator.UnregisterReporter(null));
    }

    [Test]
    public void CleanupData()
    {
        var data = new List<PerformanceDataItem>();
        var numInvocations = 0;

        // Arrange
        var aggregator = new PerformanceAggregator();
        var reporter = new MockPerformanceReporter();
        aggregator.RegisterReporter(reporter);

        aggregator.PerformanceDataUpdated += (sender, pData) =>
        {
            numInvocations++;
            data = pData.Data;
        };

        for (int i = 0; i < 20; i++)
        {
            // Act: add filter data, frame i
            reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
            {
                FrameId = reporter.FrameId,
                Stage = PerformanceDataStage.Start,
                Filter = new FilterPerformance
                {
                    BoxFilter = TimeSpan.FromMilliseconds(i),
                    LimitationFilter = TimeSpan.FromMilliseconds(i + 1),
                    ThresholdFilter = TimeSpan.FromMilliseconds(i + 2),
                    ValueFilter = TimeSpan.FromMilliseconds(i + 3),
                    UpdatePointCloud = TimeSpan.FromMilliseconds(i + 4)
                }
            });

            // Assert: cleanup, if 10 elements are reached (10th element is not propagated as it is incomplete)
            Assert.That(data.Count, Is.EqualTo(i < 10 ? i : 9));
            Assert.That(numInvocations, Is.EqualTo(i + 1));
            Assert.That(reporter.FrameId, Is.EqualTo(i));
            if (i > 0)
            {
                var clamp = i - 10 < 0 ? 0 : i - 9;
                Assert.That(data[0].FrameId, Is.EqualTo(clamp));
            }
        }
    }

    [Test]
    public void AddData_WithData_ItemsAddedAndEventTriggered()
    {
        var data = new List<PerformanceDataItem>();
        var numInvocations = 0;
        
        // Arrange
        var aggregator = new PerformanceAggregator();
        var reporter = new MockPerformanceReporter();
        aggregator.RegisterReporter(reporter);

        aggregator.PerformanceDataUpdated += (sender, pData) =>
        {
            numInvocations++;
            data = pData.Data;
        }; 

        // Act: add filter data, frame 0
        reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
        {
            FrameId = reporter.FrameId, 
            Stage = PerformanceDataStage.Start,
            Filter = new FilterPerformance
            {
                 BoxFilter = TimeSpan.FromMilliseconds(10),
                 LimitationFilter = TimeSpan.FromMilliseconds(11),
                 ThresholdFilter = TimeSpan.FromMilliseconds(12),
                 ValueFilter = TimeSpan.FromMilliseconds(13),
                 UpdatePointCloud = TimeSpan.FromMilliseconds(14)
            }
        });
        
        // Assert: incomplete data - no performance data propgated
        Assert.That(data.Count, Is.EqualTo(0));
        Assert.That(numInvocations, Is.EqualTo(1));
        Assert.That(reporter.FrameId, Is.EqualTo(0));
        
        // Act: add filter data, frame 1
        reporter.TriggerPerformanceDataUpdatedEvent(
            new PerformanceDataItem
            {
                FrameId = reporter.FrameId, 
                Stage = PerformanceDataStage.Start,
                Filter = new FilterPerformance
                {
                    BoxFilter = TimeSpan.FromMilliseconds(20),
                    LimitationFilter = TimeSpan.FromMilliseconds(21),
                    ThresholdFilter = TimeSpan.FromMilliseconds(22),
                    ValueFilter = TimeSpan.FromMilliseconds(23),
                    UpdatePointCloud = TimeSpan.FromMilliseconds(24)
                }
            });
        
        // Assert: propagate frame 0, as next filter data already arrived
        Assert.That(data.Count, Is.EqualTo(1));
        Assert.That(numInvocations, Is.EqualTo(2));
        Assert.That(data[0].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[0].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(10)));
        Assert.That(reporter.FrameId, Is.EqualTo(1));
        
        reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
        {
            FrameId = reporter.FrameId, 
            Stage = PerformanceDataStage.ProcessingData,
            Process = new ProcessPerformance
            {
                ComputeExtremumType = TimeSpan.FromMilliseconds(30),
                Preparation = TimeSpan.FromMilliseconds(31),
                Smoothing = TimeSpan.FromMilliseconds(33),
                Update = TimeSpan.FromMilliseconds(34),
                ConvertDepthValue = TimeSpan.FromMilliseconds(35)
            }
            
        });
        
        // Assert
        Assert.That(data.Count, Is.EqualTo(2));
        Assert.That(numInvocations, Is.EqualTo(3));
        Assert.That(data[0].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[0].FrameId, Is.EqualTo(0));
        Assert.That(data[0].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(10)));
        Assert.That(data[1].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[1].FrameId, Is.EqualTo(1));
        Assert.That(data[1].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(20)));
        Assert.That(data[1].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(34)));
        Assert.That(reporter.FrameId, Is.EqualTo(2));
        
        reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
        {
            FrameId = reporter.FrameId, 
            Stage = PerformanceDataStage.ProcessingData,
            Process = new ProcessPerformance
            {
                ComputeExtremumType = TimeSpan.FromMilliseconds(40),
                Preparation = TimeSpan.FromMilliseconds(41),
                Smoothing = TimeSpan.FromMilliseconds(43),
                Update = TimeSpan.FromMilliseconds(44),
                ConvertDepthValue = TimeSpan.FromMilliseconds(45)
            }
            
        });
        
        // Assert: just processing data, no frame data - no changes
        Assert.That(data.Count, Is.EqualTo(2));
        Assert.That(numInvocations, Is.EqualTo(4));
        Assert.That(data[0].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[0].FrameId, Is.EqualTo(0));
        Assert.That(data[0].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(10)));
        Assert.That(data[1].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[1].FrameId, Is.EqualTo(1));
        Assert.That(data[1].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(20)));
        Assert.That(data[1].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(34)));
        Assert.That(reporter.FrameId, Is.EqualTo(2));
        
        // Act
        reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
        {
            FrameId = reporter.FrameId, 
            Stage = PerformanceDataStage.Start,
            Filter = new FilterPerformance
            {
                BoxFilter = TimeSpan.FromMilliseconds(50),
                LimitationFilter = TimeSpan.FromMilliseconds(51),
                ThresholdFilter = TimeSpan.FromMilliseconds(52),
                ValueFilter = TimeSpan.FromMilliseconds(53),
                UpdatePointCloud = TimeSpan.FromMilliseconds(54)
            }
        });
        
        // Assert: add filter data to processing data
        Assert.That(data.Count, Is.EqualTo(3));
        Assert.That(numInvocations, Is.EqualTo(5));
        Assert.That(data[0].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[0].FrameId, Is.EqualTo(0));
        Assert.That(data[0].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(10)));
        Assert.That(data[1].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[1].FrameId, Is.EqualTo(1));
        Assert.That(data[1].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(20)));
        Assert.That(data[1].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(34)));
        Assert.That(data[2].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[2].FrameId, Is.EqualTo(2));
        Assert.That(data[2].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(50)));
        Assert.That(data[2].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(44)));
        Assert.That(reporter.FrameId, Is.EqualTo(3));
        
        // Act: add another processing data
        reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
        {
            FrameId = reporter.FrameId, 
            Stage = PerformanceDataStage.ProcessingData,
            Process = new ProcessPerformance
            {
                ComputeExtremumType = TimeSpan.FromMilliseconds(60),
                Preparation = TimeSpan.FromMilliseconds(61),
                Smoothing = TimeSpan.FromMilliseconds(63),
                Update = TimeSpan.FromMilliseconds(64),
                ConvertDepthValue = TimeSpan.FromMilliseconds(65)
            }
            
        });
        
        // Assert: add filter data to processing data
        Assert.That(data.Count, Is.EqualTo(3));
        Assert.That(numInvocations, Is.EqualTo(6));
        Assert.That(data[0].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[0].FrameId, Is.EqualTo(0));
        Assert.That(data[0].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(10)));
        Assert.That(data[1].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[1].FrameId, Is.EqualTo(1));
        Assert.That(data[1].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(20)));
        Assert.That(data[1].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(34)));
        Assert.That(data[2].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[2].FrameId, Is.EqualTo(2));
        Assert.That(data[2].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(50)));
        Assert.That(data[2].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(44)));
        Assert.That(reporter.FrameId, Is.EqualTo(3));
        
        // Act: add second processing data frame
        reporter.TriggerPerformanceDataUpdatedEvent(new PerformanceDataItem
        {
            FrameId = reporter.FrameId, 
            Stage = PerformanceDataStage.ProcessingData,
            Process = new ProcessPerformance
            {
                ComputeExtremumType = TimeSpan.FromMilliseconds(70),
                Preparation = TimeSpan.FromMilliseconds(71),
                Smoothing = TimeSpan.FromMilliseconds(73),
                Update = TimeSpan.FromMilliseconds(74),
                ConvertDepthValue = TimeSpan.FromMilliseconds(75)
            }
            
        });
        
        // Assert: just processing data, no frame data - no changes
        // Assert: add filter data to processing data
        Assert.That(data.Count, Is.EqualTo(4));
        Assert.That(numInvocations, Is.EqualTo(7));
        Assert.That(data[0].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[0].FrameId, Is.EqualTo(0));
        Assert.That(data[0].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(10)));
        Assert.That(data[1].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[1].FrameId, Is.EqualTo(1));
        Assert.That(data[1].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(20)));
        Assert.That(data[1].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(34)));
        Assert.That(data[2].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[2].FrameId, Is.EqualTo(2));
        Assert.That(data[2].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(50)));
        Assert.That(data[2].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(44)));
        Assert.That(data[3].Stage, Is.EqualTo(PerformanceDataStage.Complete));
        Assert.That(data[3].FrameId, Is.EqualTo(3));
        Assert.That(data[3].Filter.BoxFilter, Is.EqualTo(TimeSpan.FromMilliseconds(0)));
        Assert.That(data[3].Process.Update, Is.EqualTo(TimeSpan.FromMilliseconds(64)));
        Assert.That(reporter.FrameId, Is.EqualTo(4));

    }

    [Test]
    public void SyncMeasurementFlag()
    {
        // Arrange
        var reporter1 = new MockPerformanceReporter { MeasurePerformance = true, FrameId = 4};
        var reporter2 = new MockPerformanceReporter { MeasurePerformance = true, FrameId = 3 };
        var reporter3 = new MockPerformanceReporter { MeasurePerformance = false, FrameId = 2 };
        
        // Act
        var aggregator = new PerformanceAggregator(new List<IPerformanceReporter> { reporter1, reporter2 }) { MeasurePerformance = false };

        // Assert: measureperformance flag has been correctly set
        Assert.That(reporter1.MeasurePerformance, Is.False);
        Assert.That(reporter2.MeasurePerformance, Is.False);

        aggregator.MeasurePerformance = true;
        
        // Assert: measureperformance flag has been correctly set
        Assert.That(reporter1.MeasurePerformance, Is.True);
        Assert.That(reporter2.MeasurePerformance, Is.True);
        
        aggregator.RegisterReporter(reporter3);
        
        // Assert: measureperformance flag has been correctly set
        Assert.That(reporter1.MeasurePerformance, Is.True);
        Assert.That(reporter2.MeasurePerformance, Is.True);
        Assert.That(reporter3.MeasurePerformance, Is.True);

        aggregator.MeasurePerformance = false;
        
        // Assert: measureperformance flag has been correctly set
        Assert.That(reporter1.MeasurePerformance, Is.False);
        Assert.That(reporter2.MeasurePerformance, Is.False);
        Assert.That(reporter3.MeasurePerformance, Is.False);

    }
    
    [Test]
    public void RegisterReporters()
    {
        // Arrange
        var reporter1 = new MockPerformanceReporter { MeasurePerformance = false, FrameId = 4};
        var reporter2 = new MockPerformanceReporter { MeasurePerformance = false, FrameId = 3 };
        var reporter3 = new MockPerformanceReporter { MeasurePerformance = true, FrameId = 2 };
        
        // Assert: PerformanceDataUpdated event is not subscribed to by anyone
        Assert.That(reporter1.IsSubscribedToPerformanceDataUpdatedEvent, Is.False);
        Assert.That(reporter2.IsSubscribedToPerformanceDataUpdatedEvent, Is.False);
        Assert.That(reporter3.IsSubscribedToPerformanceDataUpdatedEvent, Is.False);

        var aggregator = new PerformanceAggregator(new List<IPerformanceReporter> { reporter1, reporter2 }) { MeasurePerformance = true };
        
        // Assert: aggregator should subscribe to reporters provided in constructor
        Assert.That(reporter1.IsSubscribedToPerformanceDataUpdatedEvent, Is.True);
        Assert.That(reporter2.IsSubscribedToPerformanceDataUpdatedEvent, Is.True);
        Assert.That(reporter3.IsSubscribedToPerformanceDataUpdatedEvent, Is.False);
        
        // Assert: measureperformance flag has been correctly set
        Assert.That(reporter1.MeasurePerformance, Is.True);
        Assert.That(reporter2.MeasurePerformance, Is.True);
        
        // Assert: Frame Id has been synced flag has been correctly set
        Assert.That(reporter1.FrameId, Is.EqualTo(0));
        Assert.That(reporter2.FrameId, Is.EqualTo(0));
        Assert.That(reporter3.FrameId, Is.EqualTo(2));
        
        aggregator.RegisterReporter(reporter3);
        
        // Assert: when registering, aggregator subscribes to performance dta update event
        Assert.That(reporter1.IsSubscribedToPerformanceDataUpdatedEvent, Is.True);
        Assert.That(reporter2.IsSubscribedToPerformanceDataUpdatedEvent, Is.True);
        Assert.That(reporter3.IsSubscribedToPerformanceDataUpdatedEvent, Is.True);
        
        // Assert: measureperformance flag has been correctly set
        Assert.That(reporter3.MeasurePerformance, Is.True);
        
        // Assert: Frame Id has been synced flag has been correctly set
        Assert.That(reporter1.FrameId, Is.EqualTo(0));
        Assert.That(reporter2.FrameId, Is.EqualTo(0));
        Assert.That(reporter3.FrameId, Is.EqualTo(0));
    }

    [Test]
    public void Dispose_UnregisterAllReporters()
    {
        // Arrange
        var aggregator = new PerformanceAggregator();
        var reporter1 = new MockPerformanceReporter();
        var reporter2 = new MockPerformanceReporter();
        aggregator.RegisterReporter(reporter1);
        aggregator.RegisterReporter(reporter2);

        // Act
        aggregator.Dispose();

        // Assert: aggregator should unsubscribe from reporters
        Assert.That(reporter1.IsSubscribedToPerformanceDataUpdatedEvent, Is.False);
        Assert.That(reporter2.IsSubscribedToPerformanceDataUpdatedEvent, Is.False);
    }
    
    
}