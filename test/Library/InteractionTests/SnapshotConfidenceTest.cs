using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;

namespace InteractionTests;

public class SnapshotConfidenceTest
{
    private sealed class Detector : MultiInteractionObserver
    {
        public double Now;
        public float RawConfidence;
        protected override double GetTimestampSeconds() => Now;
        protected override async Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance p)
        {
            var result = await base.Analyze(p);
            RawConfidence = result.Item1.Single().Confidence;
            return result;
        }
    }

    private static TrackingObservation Observation(int width, int height, int sequence, double time)
    {
        var cloud = new PointCloud3(width,height);
        foreach (var p in cloud.AsArray()) p.Z = 1;
        cloud[2,2].Z = .75f;
        var field = new VectorField2(width,height);
        foreach(var v in field.AsArray()) v.IsValid = false;
        field[2,2].Set(new Vector2(1,0)); field[2,2].IsValid = true;
        var neighbour = new Vector2(-.6f, MathF.Sqrt(1-.4f*.4f));
        field[1,2].Set(neighbour); field[2,1].Set(neighbour);
        return new TrackingObservation(sequence,time,cloud,field);
    }

    [Test]
    public async Task FreshSnapshotsPreserveSpatialConfidenceButRasterResizeResetsIt()
    {
        var observer = new Detector { Distance=1, MinDistance=.05f, MaxDistance=.5f,
            MinAngle=.7f, MaxConfidence=30, InteractionHistorySize=0,
            ExtremumTypeCheckMethod=ExtremumTypeCheckMethod.Global };
        for(var frame=0;frame<3;frame++)
        {
            observer.Now = 100+frame/30d;
            await observer.Update(Observation(5,5,frame,observer.Now));
            Assert.That(observer.RawConfidence, Is.EqualTo(frame), "Snapshot identity must not clear pixel evidence.");
        }
        foreach(var size in new[]{(6,5),(6,6)})
        {
            observer.Now += 1/30d;
            await observer.Update(Observation(size.Item1,size.Item2,10,observer.Now));
            Assert.That(observer.RawConfidence, Is.Zero, "Both width and height changes invalidate old raster evidence.");
        }
    }
}
