#!/usr/bin/env python3
"""Generate an isolated, diagnostic-only original JPDA tracker from a pinned commit."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


revision, destination = sys.argv[1:3]
revision = subprocess.check_output(["git", "rev-parse", "--verify", revision + "^{commit}"], text=True).strip()
destination = Path(destination).resolve()
destination.mkdir(parents=True, exist_ok=True)
classes = ["InteractionSmoothingBehaviour", "JpdaContactAssignment", "KalmanContactMotion", "ContactMotion",
           "MinimumCostContactAssignment", "MinimumCostAssignment", "GreedyContactAssignment"]
metadata = {"revision": revision, "transformation": "Only rename tracker/private helper types with a Baseline prefix.", "files": {}}
for name in classes:
    folder = "Components" if name == "InteractionSmoothingBehaviour" else "Util"
    source_path = f"library/src/Core/Interactivity/{folder}/{name}.cs"
    source = subprocess.check_output(["git", "show", f"{revision}:{source_path}"], text=True)
    generated = re.sub(r"\b(" + "|".join(classes) + r")\b", lambda match: "Baseline" + match[0], source)
    filename = "Baseline" + name + ".cs"
    (destination / filename).write_text(generated)
    metadata["files"][filename] = {"path": source_path,
        "original_sha256": hashlib.sha256(source.encode()).hexdigest(),
        "generated_sha256": hashlib.sha256(generated.encode()).hexdigest()}
(destination / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps({"revision": revision, "files": len(classes), "destination": str(destination)}))
