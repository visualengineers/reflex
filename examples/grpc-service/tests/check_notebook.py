"""Run in the notebook image: python /app/example/tests/check_notebook.py."""
import os
from pathlib import Path
import tempfile

import nbformat
from nbclient import NotebookClient
from backend import create_server

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
            NotebookClient(notebook, timeout=60, kernel_name='python3').execute()
            assert any('image/png' in output.get('data', {})
                       for cell in notebook.cells if cell.cell_type == 'code'
                       for output in cell.outputs), f'No plot in {mode} mode'
            print(f'Notebook {mode}: executed successfully with rendered plots')
    finally:
        server.stop(0).wait()
