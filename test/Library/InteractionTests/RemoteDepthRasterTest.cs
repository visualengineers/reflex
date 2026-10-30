using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

public class RemoteDepthRasterTest
{
    private static PointCloud3 Cloud(int width, int height)
    {
        var cloud = new PointCloud3(width, height);
        for (var i = 0; i < cloud.Size; i++) cloud.AsArray()[i].Set(100+i, 200+i, i+1);
        return cloud;
    }

    [TestCase(0, 7, 5)]
    [TestCase(1, 4, 3)]
    [TestCase(3, 2, 2)]
    public void RegularRasterReconstructsNonDivisibleResolution(int skip, int width, int height)
    {
        var cloud = Cloud(7,5);
        var raster = new RemoteDepthRaster(cloud,skip,true);
        Assert.That(raster.Width,Is.EqualTo(width));
        Assert.That(raster.Height,Is.EqualTo(height));
        for (var i = 0; i < raster.Depths.Count; i++)
        {
            Assert.That(raster.TryGetSensorIndex(i,out var index),Is.True);
            Assert.That(index,Is.EqualTo(i/width*(skip+1)*7+i%width*(skip+1)));
            Assert.That(raster.Depths[i],Is.EqualTo(cloud.AsArray()[index].Z));
        }
    }

    [Test]
    public void MissingSamplesKeepTheirPositions()
    {
        var cloud = Cloud(5,5);
        cloud.AsArray()[6].IsValid=false;
        cloud.AsArray()[7].IsFiltered=true;
        cloud.AsArray()[8].Z=float.PositiveInfinity;
        var raster = new RemoteDepthRaster(cloud,0,false);
        Assert.That(raster.Depths.Count,Is.EqualTo(25));
        foreach(var index in new[]{6,7,8}) Assert.That(float.IsNaN(raster.Depths[index]),Is.True);
        var complete = new RemoteDepthRaster(cloud,0,true);
        Assert.That(complete.Depths[6],Is.EqualTo(7));
        Assert.That(complete.Depths[7],Is.EqualTo(8));
        Assert.That(float.IsNaN(complete.Depths[8]),Is.True);
        Assert.Throws<ArgumentException>(()=>raster.CreateCandidate(6,1,0,0));
    }

    [Test]
    public void RequestGeometryAndDataAreIndependentOfSubsequentChanges()
    {
        var cloud=Cloud(7,5);
        var pending=new RemoteDepthRaster(cloud,1,true);
        var later=new RemoteDepthRaster(cloud,3,false);
        cloud.AsArray()[32].Z=999;
        var result=pending.CreateCandidate(10,1.3f,42,123);
        Assert.That(result.Position.X,Is.EqualTo(4));
        Assert.That(result.Position.Y,Is.EqualTo(4));
        Assert.That(pending.Depths[10],Is.EqualTo(33));
        result.Position.Z=0;
        Assert.That(cloud.AsArray()[32].Z,Is.EqualTo(999));
        Assert.That(later.SampleStep,Is.EqualTo(4));
        Assert.That(result.Type,Is.EqualTo(InteractionType.None));
    }

    [Test]
    public void RejectsInvalidIndicesDepthsAndSkip()
    {
        var cloud=Cloud(7,5);
        var raster=new RemoteDepthRaster(cloud,1,true);
        foreach(var index in new[]{-1,12,int.MaxValue})
            Assert.Throws<ArgumentException>(()=>raster.CreateCandidate(index,1,0,0));
        Assert.Throws<ArgumentException>(()=>raster.CreateCandidate(0,float.NaN,0,0));
        Assert.Throws<ArgumentOutOfRangeException>(()=>new RemoteDepthRaster(cloud,-1,true));
        Assert.Throws<ArgumentOutOfRangeException>(()=>new RemoteDepthRaster(cloud,int.MaxValue,true));
    }

    private class Processor : RemoteInteractionProcessor
    {
        public Processor() : base(new MockRemoteInteractionProcessorService()) { }
        public static List<Interaction> Classify(IEnumerable<Interaction> items,float plane,float zone)
        {
            var processor = new Processor { Distance = plane, MinDistance = zone, MaxDistance = .25f };
            return processor.ConvertDepthValue(items.ToList());
        }
    }

    [Test]
    public void ReclassifiesAbsoluteDepthAndRejectsDeadZone()
    {
        var push=new Interaction { Position=new Point3(1,1,1.3f),Type=InteractionType.Pull };
        var pull=new Interaction { Position=new Point3(2,2,1.6f),Type=InteractionType.Push };
        var result=Processor.Classify(new[]{push,pull,
            new Interaction{Position=new Point3(0,0,1.45f)},
            new Interaction{Position=new Point3(0,0,1.455f)},
            new Interaction{Position=new Point3(0,0,1.445f)},
            new Interaction{Position=new Point3(0,0,float.NaN)}},1.45f,.01f);
        Assert.That(result.Count,Is.EqualTo(2));
        Assert.That(push.Type,Is.EqualTo(InteractionType.Push));
        Assert.That(pull.Type,Is.EqualTo(InteractionType.Pull));
        Assert.That(push.Position.Z,Is.EqualTo((1.45f-1.3f-.01f)/(.01f-.25f)).Within(.00001));
        Assert.That(pull.Position.Z,Is.EqualTo((1.6f-.01f-1.45f)/(.25f-.01f)).Within(.00001));
        Assert.That(Processor.Classify(new[]{new Interaction{Position=new Point3(0,0,1.45f)}},1.45f,0),Is.Empty);
    }
}
