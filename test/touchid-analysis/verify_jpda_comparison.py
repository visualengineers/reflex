#!/usr/bin/env python3
"""Independently audit saved JPDA replay results and write derived comparison statistics.
Run from the repository root: python3 test/touchid-analysis/verify_jpda_comparison.py CAPTURE RESULTS_ROOT
"""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import struct
import re
import subprocess


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def read_csv(path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def float32(value):
    return struct.unpack("f", struct.pack("f", value))[0]


def objective(snapshot):
    targets = {t["id"]: t for t in snapshot["targets"]}
    matches = [i for i in snapshot["assigned"] if i["TouchId"] in targets]
    # Reproduce float32 subtraction/addition in the production Manhattan helper.
    total = 0.0
    for item in matches:
        point, target = item["Position"], targets[item["TouchId"]]
        dx = abs(float32(float32(point["X"]) - float32(target["x"])))
        dy = abs(float32(float32(point["Y"]) - float32(target["y"])))
        total += float32(dx + dy) / 81
    return total + .5 * (len(snapshot["assigned"]) - len(matches)) + .5 * (len(targets) - len(matches))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture", type=Path)
    parser.add_argument("results", type=Path)
    parser.add_argument("--optimization", action="store_true", help="Audit the pinned original/optimized JPDA pair.")
    parser.add_argument("--skip-source-check", action="store_true", help="Audit an archive after its measured sources changed.")
    args = parser.parse_args()
    modes = ("jpda-original", "jpda-optimized") if args.optimization else ("global", "jpda")
    comparison_name = "/".join(modes)
    original = json.loads(Path("test/analysis/touchid-3512/assignment-comparison/results.json").read_text())
    summary = {"verification_script_sha256": digest(Path(__file__)), "profiles": {}, "derived_from_sha256": {}}
    for model in ("linear", "kalman"):
        previous_quality = None
        previous_comparisons = None
        profile = {"processes": {}}
        for process in (1, 2):
            base = args.results / model / f"process-{process}"
            data = json.loads((base / "results.json").read_text())
            metadata = data["metadata"]
            assert metadata["input_hashes"] == original["metadata"]["input_hashes"]
            assert metadata["configuration"]["fixed_kalman"] == (model == "kalman")
            assert metadata["comparison"] == comparison_name and not metadata["quality_only"]
            if args.optimization:
                package = metadata["baseline_metadata"]
                assert package["revision"].startswith("4290171a")
                classes = [Path(f["path"]).stem for f in package["files"].values()]
                for filename, info in package["files"].items():
                    source = subprocess.check_output(["git", "show", package["revision"] + ":" + info["path"]])
                    assert hashlib.sha256(source).hexdigest() == info["original_sha256"]
                    generated = re.sub(r"\b(" + "|".join(classes) + r")\b", lambda m: "Baseline" + m[0], source.decode()).encode()
                    assert hashlib.sha256(generated).hexdigest() == info["generated_sha256"], filename
            config = metadata["configuration"]
            smooth = config["settings"]["FilterSettingValues"]["SmoothingValues"]
            # The archived analysis intentionally fixes these values; do not silently apply
            # its fixed gate/cost/reference calculations to another experiment.
            assert smooth["TouchMergeDistance2D"] == 81 and smooth["ContactRetentionSeconds"] == .1
            assert config["settings"]["AssignmentMissCost"] == config["settings"]["AssignmentBirthCost"] == .5
            assert metadata["warmup_replays"] == 10 and metadata["timing_repeats"] == 31
            for name, expected in metadata["input_hashes"].items():
                assert digest(args.capture / name) == expected.upper(), name
            if not args.skip_source_check:
                for name, expected in metadata["source_sha256"].items():
                    assert digest(Path(name)) == expected.upper(), name
            frames = read_csv(base / "frames.csv")
            timing = read_csv(base / "timing-replays.csv")
            reassociations = read_csv(base / "reassociations.csv")
            tracks = json.loads((base / "tracks.json").read_text())
            differences = json.loads((base / "differences.json").read_text())
            quality = [r for r in data["results"] if not r.get("timing")]
            assert len(frames) == len(tracks) == 2514 and len(timing) == 248
            if previous_quality is not None:
                assert quality == previous_quality and data["comparisons"] == previous_comparisons
                for filename in ("frames.csv", "tracks.json", "differences.json", "reassociations.csv", "association-changes.csv") + (("recovery-controls.json",) if args.optimization else ()):
                    assert digest(base / filename) == digest(args.results / model / "process-1" / filename), filename
            previous_quality, previous_comparisons = quality, data["comparisons"]
            for result in quality:
                name, mode = result["recording"], result["mode"]
                references = json.loads((args.capture / (name + "-input.json")).read_text())
                captures = json.loads((args.capture / (name + ".json")).read_text())
                selected = [t for t in tracks if t["recording"] == name and t["mode"] == mode]
                prev, prev_active, changes, births, missing, ids = [None, None], False, [0, 0], set(), 0, set()
                last_seen, gaps, recoveries = {}, 0, 0
                for frame in selected:
                    index = frame["frame"]
                    ref, now = references[index], captures[index]["time"]
                    current = []
                    for layer in ("published", "assigned"):
                        candidates = [i for i in frame[layer] if name != "Half-Circle"
                                      or (i["x"] - 249) ** 2 + (i["y"] - 210) ** 2 > 3600]
                        if layer == "published":
                            ids.update(i["id"] for i in candidates)
                        nearest = min(candidates, key=lambda i: (i["x"] - ref["x"]) ** 2 + (i["y"] - ref["y"]) ** 2, default=None)
                        current.append(None if nearest is None else nearest["id"])
                    for axis in (0, 1):
                        changes[axis] += bool(ref["aboveThreshold"] and prev_active and prev[axis] is not None
                                              and current[axis] is not None and current[axis] != prev[axis])
                    missing += bool(ref["aboveThreshold"] and current[0] is None)
                    for item in frame["assigned"]:
                        if item["state"] == 0:
                            assert item["id"] not in births
                            births.add(item["id"])
                        if item["id"] in last_seen and last_seen[item["id"]][0] < index - 1:
                            gaps += 1
                            recoveries += now > last_seen[item["id"]][1] + .1
                        last_seen[item["id"]] = (index, now)
                    prev, prev_active = current, ref["aboveThreshold"]
                assert changes == [result["representative_changes"], result["raw_representative_changes"]]
                assert births == set(range(result["created_tracks"]))
                assert missing == result["active_without_output"] and len(ids) == result["published_target_ids"]
                assert gaps == result["reassociations_after_gap"] and recoveries == result["recoveries_beyond_retention"]
                rows = [r for r in frames if r["recording"] == name and r["mode"] == mode]
                assert sum(int(r["births"]) for r in rows) == len(births)
                assert sum(r["jpda_approximate"] == "true" for r in rows) == result["jpda_approximation_frames"]
                assert sum(bool(r["reserved_ids"]) for r in rows) == result["frames_with_reservations"]
                assert max(len(r["reserved_ids"].split()) for r in rows) == result["maximum_reservations"]
                assert sum(int(r["recoveries_beyond_retention"]) for r in rows) == recoveries
                assert len([r for r in reassociations if r["recording"] == name and r["mode"] == mode]) == gaps
            for comparison in data["comparisons"]:
                subset = [r for r in differences if r["recording"] == comparison["recording"]]
                for stage in ("assigned", "tracked", "published"):
                    assert sum(r[f"{stage}_changed"] for r in subset) == comparison[f"{stage}_frames_different"]
            aggregate = {}
            for mode in modes:
                rows = [r for r in timing if r["mode"] == mode]
                assert len(rows) == 124 and sum(int(r["frames"]) for r in rows) == 38967
                for row in rows:
                    assert math.isclose(float(row["combined_total_us"]), float(row["update_total_us"]) + float(row["diagnostics_total_us"]))
                    repeat = int(row["repeat"])
                    assert row["order"] == (comparison_name if repeat % 2 == 0 else "/".join(reversed(modes)))
                for name in ("Half-Circle", "Line", "Circle", "Multi-Touch"):
                    assert sorted(int(r["repeat"]) for r in rows if r["recording"] == name) == list(range(31))
                aggregate[mode] = {stage + "_mean_us": sum(float(r[stage + "_total_us"]) for r in rows) / 38967
                                   for stage in ("update", "diagnostics", "combined")}
                if all("update_and_diagnostics_allocated_bytes" in r for r in rows):
                    aggregate[mode]["combined_allocated_mean_bytes"] = sum(int(r["update_and_diagnostics_allocated_bytes"]) for r in rows) / 38967
            aggregate["overhead_percent"] = {stage: (aggregate[modes[1]][stage + "_mean_us"] / aggregate[modes[0]][stage + "_mean_us"] - 1) * 100
                                               for stage in ("update", "combined")}
            if "combined_allocated_mean_bytes" in aggregate[modes[0]]:
                aggregate["allocation_change_percent"] = (aggregate[modes[1]]["combined_allocated_mean_bytes"]
                    / aggregate[modes[0]]["combined_allocated_mean_bytes"] - 1) * 100
            if args.optimization:
                assert differences == []
                assert all(all(c[key] == 0 for key in ("assigned_frames_different", "tracked_frames_different", "published_frames_different", "diagnostic_frames_different")) for c in data["comparisons"])
                for name in ("Half-Circle", "Line", "Circle", "Multi-Touch"):
                    pair = [r for r in quality if r["recording"] == name]
                    assert {k:v for k,v in pair[0].items() if k != "mode"} == {k:v for k,v in pair[1].items() if k != "mode"}
                controls = json.loads((base / "recovery-controls.json").read_text())
                assert len(controls) == 6
                for control in controls:
                    assert control["original"] == control["optimized"]
                    assert control["optimized"]["allocated_ids"] == control["expected_allocated_ids"]
            profile["processes"][str(process)] = aggregate
            for filename in ("results.json", "frames.csv", "tracks.json", "differences.json", "reassociations.csv", "association-changes.csv", "timing-replays.csv"):
                summary["derived_from_sha256"][str(base / filename)] = digest(base / filename)
            if args.optimization:
                summary["derived_from_sha256"][str(base / "recovery-controls.json")] = digest(base / "recovery-controls.json")
            print(f"{model}/process-{process}: hashes, 2514 frames, 248 replay totals, identities, births, gaps and process agreement verified")
        profile["quality"] = previous_quality
        profile["comparisons"] = previous_comparisons
        if differences:
            first = differences[0]
            assert first["baseline"]["targets"] == first["candidate"]["targets"]
            profile["first_difference"] = {"recording": first["recording"], "frame": first["frame"],
                "jpda_approximate": first["candidate"]["jpda_approximate"],
                "baseline_cost": objective(first["baseline"]), "jpda_cost": objective(first["candidate"])}
        else:
            profile["first_difference"] = None
        maximum = (0, None, None)
        ordered_changes, set_changes = 0, 0
        for frame in differences:
            baseline, candidate = frame["baseline"]["published"], frame["candidate"]["published"]
            a, b = [i["TouchId"] for i in baseline], [i["TouchId"] for i in candidate]
            ordered_changes += a != b
            set_changes += set(a) != set(b)
            a, b = {i["TouchId"]: i["Position"] for i in baseline}, {i["TouchId"]: i["Position"] for i in candidate}
            for identity in a.keys() & b.keys():
                distance = math.hypot(a[identity]["X"] - b[identity]["X"], a[identity]["Y"] - b[identity]["Y"])
                if distance > maximum[0]:
                    maximum = (distance, frame["frame"], identity)
        profile["published_ordered_ids_different_frames"] = ordered_changes
        profile["published_id_sets_different_frames"] = set_changes
        profile["maximum_common_id_xy_deviation"] = {"pixels": maximum[0], "frame": maximum[1], "touch_id": maximum[2]}
        summary["profiles"][model] = profile
    (args.results / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")


if __name__ == "__main__":
    main()
