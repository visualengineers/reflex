using Math = System.Math;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

static class Analysis
{
    public static void Run(string directory)
    {
        var summaries = new List<object>();
        foreach (var path in Directory.GetFiles(directory, "*.json").Where(p => new[] {"Half-Circle", "Line", "Circle"}.Contains(Path.GetFileNameWithoutExtension(p))))
        {
            var data = JArray.Parse(File.ReadAllText(path));
            foreach (var mode in new[] { "off", "linear3", "linear9", "quadratic3", "linear3-wide", "linear3-min2", "linear3-every2" })
            {
                var tracker = new InteractionSmoothingBehaviour(15) {
                    MaxConfidence = 30, TouchMergeDistance2D = mode.EndsWith("wide") ? 400 : 81,
                    ContactRetentionSeconds = .1, UseVelocityForMapping = mode != "off",
                    NumFramesForPrediction = mode == "linear9" ? 9 : 3,
                    UseSecondDerivation = mode == "quadratic3", NumFramesSmoothing = 3 };
                tracker.UpdateFilterType(FilterType.MovingAverage);
                var rows = new List<object>();
                var born = 0; var empty = 0; var switches = 0; var lastId = -1; var frames = 0;
                var noTargetDetection = 0; var noTargetOutput = 0;
                foreach (var f in data)
                {
                    var index = (int)f["frame"];
                    if (mode.EndsWith("every2") && index % 2 != 0) continue;
                    var candidates = f["clean"].ToObject<List<Interaction>>();
                    foreach (var c in candidates) c.Confidence = 0; // Snapshot matrix reset in production MultiTouch.
                    var result = tracker.Update(candidates, (double)f["time"]);
                    var measured = result.Interactions.Where(i => i.TrackingState != InteractionTrackingState.Lost).ToList();
                    born += measured.Count(i => i.TrackingState == InteractionTrackingState.Tentative);
                    var published = new List<Interaction>();
                    foreach (var i in result.Interactions.Where(i => i.Confidence > (mode.EndsWith("min2") ? 2 : 0))
                                 .OrderBy(i => i.TrackingState == InteractionTrackingState.Lost).ThenByDescending(i => i.Confidence).ThenBy(i => i.TouchId))
                        if (published.All(p => Point3.Squared2DDistance(p.Position,i.Position) >= 58)) published.Add(i);
                    bool IsTarget(Interaction i) => Path.GetFileNameWithoutExtension(path) != "Half-Circle" ||
                        Math.Pow(i.Position.X - 249, 2) + Math.Pow(i.Position.Y - 210, 2) > 60*60;
                    var targetCandidates = candidates.Where(IsTarget).ToList();
                    var targetPublished = published.Where(IsTarget).ToList();
                    if (targetCandidates.Count > 0 && targetPublished.Count == 0) empty++;
                    if (targetCandidates.Count == 0) noTargetDetection++;
                    if (targetPublished.Count == 0) noTargetOutput++;
                    var reference = targetCandidates.OrderByDescending(i => Math.Abs(i.Position.Z)).FirstOrDefault()?.Position;
                    var nearest = reference == null ? targetPublished.FirstOrDefault() : targetPublished.OrderBy(i =>
                        Math.Pow(i.Position.X-reference.X,2)+Math.Pow(i.Position.Y-reference.Y,2)).FirstOrDefault();
                    if (nearest != null) { if (lastId >= 0 && lastId != nearest.TouchId) switches++; lastId = nearest.TouchId; }
                    rows.Add(new { frame = index, clean = candidates.Count, born = measured.Count(i => i.TrackingState == InteractionTrackingState.Tentative),
                        ids = published.Select(i => i.TouchId), representative = nearest?.TouchId,
                        position = nearest?.Position, velocities = tracker.GetVelocities(result) });
                    frames++;
                }
                summaries.Add(new { recording = Path.GetFileNameWithoutExtension(path), mode, frames, born, emptyDespiteDetection = empty, noTargetDetection, noTargetOutput, representativeSwitches = switches });
                File.WriteAllText(Path.Combine(directory, Path.GetFileNameWithoutExtension(path) + "-" + mode + ".json"), JsonConvert.SerializeObject(rows));
            }
        }
        File.WriteAllText(Path.Combine(directory,"summary.json"),JsonConvert.SerializeObject(summaries,Formatting.Indented));
        Console.WriteLine(JsonConvert.SerializeObject(summaries,Formatting.Indented));
        var greedy = new InteractionSmoothingBehaviour(15) { MaxConfidence=30, TouchMergeDistance2D=81, ContactRetentionSeconds=.1 };
        Interaction P(float x) => new(new Point3(x,0,-.5f),InteractionType.Push,1);
        greedy.Update(new[]{P(0),P(100)},100);
        var assigned = greedy.Update(new[]{P(80),P(120)},100.01);
        File.WriteAllText(Path.Combine(directory,"greedy.json"),JsonConvert.SerializeObject(assigned));
        // Deterministic reversal: recent motion predicts +6 while the measurement has reversed by -6.
        foreach (var n in new[] {3,9})
        {
            var t = new InteractionSmoothingBehaviour(15) { MaxConfidence=30, UseVelocityForMapping=true, NumFramesForPrediction=n, TouchMergeDistance2D=81, ContactRetentionSeconds=.1 };
            var rows = new List<object>();
            var xs = Enumerable.Range(0,12).Select(i=>i*6f).Concat(Enumerable.Range(1,8).Select(i=>66-i*6f)).ToArray();
            for(var i=0;i<xs.Length;i++)
            {
                var f=t.Update(new[]{new Interaction(new Point3(xs[i],0,-.5f),InteractionType.Push,1)},100+i/30.0);
                rows.Add(new {frame=i,x=xs[i],measured=f.Interactions.Where(p=>p.TrackingState!=InteractionTrackingState.Lost),diagnostics=t.GetVelocities(f)});
            }
            File.WriteAllText(Path.Combine(directory,$"reversal{n}.json"),JsonConvert.SerializeObject(rows));
        }
    }
}
