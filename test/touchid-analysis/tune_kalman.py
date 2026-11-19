#!/usr/bin/env python3
"""Evaluate compiled production Kalman constants; restore source and rebuild on exit.

Run from the repository root. The sweep is offline and never adds mutable tuning state
to the application. Do not concurrently edit KalmanContactMotion.cs or build this project.
"""
import argparse
import hashlib
import itertools
import json
from pathlib import Path
import re
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--q", type=float, nargs="+", default=[400, 4000, 40000, 100000, 200000, 400000, 1000000, 4000000])
    parser.add_argument("--r", type=float, nargs="+", default=[1, 4, 16])
    parser.add_argument("--velocity-variance", type=float, nargs="+", default=[10000])
    args = parser.parse_args()
    source = Path("library/src/Core/Interactivity/Util/KalmanContactMotion.cs")
    project = "test/touchid-analysis/TouchIdAnalysis.csproj"
    original = source.read_text()
    expected = original
    report = {"complete": False, "original_source_sha256": hashlib.sha256(original.encode()).hexdigest(),
              "selection_note": "Exploratory replay tuning; these recordings are not an independent validation set.",
              "grid": {"q": args.q, "r": args.r, "initial_velocity_variance": args.velocity_variance}, "candidates": []}
    args.output.parent.mkdir(parents=True, exist_ok=True)

    def save():
        args.output.write_text(json.dumps(report, indent=2) + "\n")

    def build(log):
        with log.open("w") as handle:
            subprocess.run(["dotnet", "build", project, "-c", "Release", "--no-restore", "-m:1", "-nr:false",
                            "-p:UseSharedCompilation=false", "--verbosity", "quiet"],
                           stdout=handle, stderr=subprocess.STDOUT, check=True)

    with tempfile.TemporaryDirectory(prefix="reflex-kalman-tuning-") as work:
        work = Path(work)
        try:
            for index, (q, r, velocity) in enumerate(itertools.product(args.q, args.r, args.velocity_variance)):
                if source.read_text() != expected:
                    raise RuntimeError("Concurrent source modification; refusing to overwrite it.")
                expected = original
                for name, value in (("AccelerationSpectralDensity", q), ("MeasurementVariance", r), ("InitialVelocityVariance", velocity)):
                    expected, count = re.subn(rf"(internal const double {name} = )[^;]+;", rf"\g<1>{value:.17g};", expected)
                    if count != 1:
                        raise RuntimeError(f"Cannot find unique constant {name}")
                source.write_text(expected)
                build(work / "build.log")
                out = work / str(index)
                subprocess.run(["dotnet", "run", "--no-build", "-c", "Release", "--project", project,
                                "--", "--compare-motion", str(args.capture), str(out), "--quality-only"], check=True)
                data = json.loads((out / "results.json").read_text())
                config = data["metadata"]["configuration"]
                assert config["kalman_acceleration_spectral_density"] == q
                assert config["kalman_measurement_variance"] == r
                assert config["kalman_initial_velocity_variance"] == velocity
                report["candidates"].append(data)
                save()
                kalman = [row for row in data["results"] if row["mode"] == "kalman"]
                print(f"q={q:g} R={r:g} V0={velocity:g}: births={[row['created_tracks'] for row in kalman]}, "
                      f"output changes={[row['representative_changes'] for row in kalman]}", flush=True)
            report["complete"] = True
            save()
        finally:
            if source.read_text() != expected:
                raise RuntimeError("Concurrent source modification; original source not restored automatically.")
            source.write_text(original)
            build(work / "restore-build.log")


if __name__ == "__main__":
    main()
