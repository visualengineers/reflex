"""Run in the notebook image: python /app/example/tests/check_notebook.py."""
import os
from pathlib import Path
import tempfile
import textwrap

import nbformat
from nbclient import NotebookClient
from backend import create_server

def main():
    source = Path(os.getenv('NOTEBOOK_PATH', '/home/reflex/work/live-interactions.ipynb'))
    with tempfile.TemporaryDirectory() as directory:
        snapshot = Path(directory) / 'latest.json'
        server, port = create_server(snapshot, '127.0.0.1:0')
        server.start()
        os.environ['GRPC_TARGET'] = f'127.0.0.1:{port}'
        os.environ['SNAPSHOT_PATH'] = str(snapshot)
        os.environ['MPLCONFIGDIR'] = directory
        try:
            for mode in ('demo', 'observe'):
                notebook = nbformat.read(source, as_version=4)
                nbformat.validate(notebook)
                for cell in notebook.cells:
                    if cell.cell_type == 'code':
                        cell.source = cell.source.replace('MODE = "observe"', f'MODE = "{mode}"')
                        cell.source = cell.source.replace('DURATION_SECONDS = 60', 'DURATION_SECONDS = 2')
                        cell.source = cell.source.replace('await measure_pipeline()', 'await measure_pipeline(duration_seconds=1)')
                # Inspect the actual third axes produced by the live plotting cell.
                # A rendered PNG alone does not prove that candidates were drawn.
                notebook.cells.append(nbformat.v4.new_code_cell(textwrap.dedent("""
    assert snapshot['interactions'], 'Test frame must contain extrema'
    assert all(i['type'] == 'NONE' for i in snapshot['interactions'])
    assert len(axes[2].collections) == 2, 'Expected minimum and maximum marker layers'
    for collection, kind in zip(axes[2].collections, ('MINIMUM', 'MAXIMUM')):
        hits = [i for i in snapshot['interactions'] if i['extremum_kind'] == kind]
        assert hits, f'Missing test candidates for {kind}'
        expected = np.array([(i['point_idx'] % width, i['point_idx'] // width) for i in hits])
        np.testing.assert_allclose(collection.get_offsets(), expected)
        from matplotlib.colors import to_rgba
        expected_colors = [to_rgba('crimson' if i['z'] < plane else 'royalblue'
                                   if i['z'] > plane else 'gray') for i in hits]
        np.testing.assert_allclose(collection.get_facecolors(), expected_colors)
        assert collection.get_visible()
        assert collection.get_zorder() > axes[2].images[0].get_zorder()
        assert np.all(collection.get_sizes() > 0)
    assert sum(len(c.get_offsets()) for c in axes[2].collections) == len(snapshot['interactions'])
    print('Candidate markers: positions, colours and visibility verified')
    if MODE == 'demo':
        assert len(timing_samples) > 0
        assert timing_samples.index.is_unique
        assert 'server_snapshot_enqueue' in timing_statistics.index
        assert 'client_rpc_roundtrip' in timing_statistics.index
        assert timing_statistics.loc['server_total', 'count'] == len(timing_samples)
        assert timing_statistics.loc['server_total', 'p99'] >= timing_statistics.loc['server_total', 'p50']
    else:
        assert timing_samples.empty, 'Observe must not reuse old demo frames'
    """)))
                NotebookClient(notebook, timeout=60, kernel_name='python3').execute()
                assert any('image/png' in output.get('data', {})
                           for cell in notebook.cells if cell.cell_type == 'code'
                           for output in cell.outputs), f'No plot in {mode} mode'
                print(f'Notebook {mode}: executed successfully with rendered plots')
        finally:
            server.stop(0).wait()


if __name__ == "__main__":
    main()
