"""Export compact diagnostics from production replay captures; Python standard library only."""
import csv
import json
import math
from pathlib import Path
import sys
from xml.sax.saxutils import escape

source, output = map(Path, sys.argv[1:3])
output.mkdir(parents=True, exist_ok=True)
summary = []
frame_rows = []
svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="350" viewBox="0 0 1100 350">',
       '<rect width="1100" height="350" fill="white"/>',
       '<style>text{font:14px sans-serif;fill:#172033}</style>',
       '<text x="24" y="28" font-weight="bold">TouchId im Replay: bewegte Druckstelle</text>',
       '<text x="24" y="52">Farben = IDs (zyklische Palette); Rot = aktiver Eingang ohne Ausgabe; Grau = Kontaktpause</text>']
colors = ['#2563eb', '#16a34a', '#7c3aed', '#c026d3', '#0891b2', '#ca8a04', '#ea580c', '#475569']
for row, name in enumerate(['Half-Circle', 'Line', 'Circle']):
    data = json.loads((source / (name + '.json')).read_text())
    inputs = json.loads((source / (name + '-input.json')).read_text())
    counts = dict(recording=name, frames=len(data), active_input=0, active_without_candidate=0,
                  active_without_output=0, id_changes_consecutive_active_outputs=0,
                  published_target_ids=0, created_tracks=0)
    ids, tracks = set(), set()
    previous = None
    y = 92 + row * 78
    svg.append(f'<text x="24" y="{y+16}">{escape(name)}</text>')
    for f, r in zip(data, inputs):
        def target(i):
            p = i['Position']
            return name != 'Half-Circle' or math.hypot(p['X']-249, p['Y']-210) > 60
        clean = [i for i in f['clean'] if target(i)]
        published = [i for i in f['published'] if target(i)]
        nearest = min(published, key=lambda i: math.hypot(i['Position']['X']-r['x'], i['Position']['Y']-r['y']), default=None)
        active = r['aboveThreshold']
        counts['active_input'] += active
        counts['active_without_candidate'] += active and not clean
        counts['active_without_output'] += active and not published
        if active and nearest and previous and previous[0] and previous[1] is not None:
            counts['id_changes_consecutive_active_outputs'] += previous[1] != nearest['TouchId']
        previous = (active, nearest['TouchId'] if nearest else None)
        ids.update(i['TouchId'] for i in published)
        tracks.update(i['TouchId'] for i in f['clean'])
        color = '#d1d5db' if not active else '#dc2626' if not nearest else colors[nearest['TouchId'] % len(colors)]
        x = 140 + f['frame'] * 920 / len(data)
        svg.append(f'<rect x="{x:.2f}" y="{y}" width="{920/len(data)+.1:.2f}" height="28" fill="{color}"><title>{name}, Frame {f["frame"]}, ID {nearest["TouchId"] if nearest else "keine"}</title></rect>')
        frame_rows.append(dict(recording=name, frame=f['frame'], input_active=active,
                               input_x=r['x'], input_y=r['y'], input_depth_offset=r['offset'],
                               classified_target_candidates=len(clean), published_target_count=len(published),
                               representative_id=nearest['TouchId'] if nearest else '',
                               published_ids=' '.join(str(i['TouchId']) for i in published),
                               raw_candidates=f['rawCount']))
    counts['published_target_ids'] = len(ids)
    counts['created_tracks'] = len(tracks)
    summary.append(counts)
    for f in range(0, len(data), 50):
        svg.append(f'<text x="{140+f*920/len(data):.1f}" y="{y+47}" font-size="11">{f}</text>')
svg.append('<text x="1010" y="340">Frame</text></svg>')
(output / 'timeline.svg').write_text('\n'.join(svg))
for name, rows in [('summary.csv', summary), ('frames.csv', frame_rows)]:
    with (output / name).open('w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
(output / 'prediction-comparison.json').write_text((source / 'summary.json').read_text())
print(json.dumps(summary, indent=2))
