"""Generate the diagnostic-only historical tracker; never modify production sources."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

revision, output = sys.argv[1:3]
revision = subprocess.check_output(['git', 'rev-parse', '--verify', revision + '^{commit}'], text=True).strip()
path = 'library/src/Core/Interactivity/Components/InteractionSmoothingBehaviour.cs'
source = subprocess.check_output(['git', 'show', f'{revision}:{path}'], text=True)
if 'Greedy one-to-one assignment' not in source:
    raise SystemExit('The selected revision is not the expected greedy tracker.')
output = Path(output).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(source.replace('InteractionSmoothingBehaviour', 'GreedyInteractionSmoothingBehaviour'))
metadata = dict(revision=revision, path=path, originalSha256=hashlib.sha256(source.encode()).hexdigest(),
                generatedSha256=hashlib.sha256(output.read_bytes()).hexdigest())
Path(str(output) + '.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2))
