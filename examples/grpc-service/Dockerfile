FROM python:3.10-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/app:/app/example
COPY services/python-backend/requirements.txt /tmp/backend-requirements.txt
# The existing backend requirements are UTF-16 encoded.
RUN python -c "from pathlib import Path; p=Path('/tmp/backend-requirements.txt'); p.write_text(p.read_text(encoding='utf-16'), encoding='utf-8')" \
    && pip install --no-cache-dir -r /tmp/backend-requirements.txt
COPY services/python-backend /app
RUN python -m grpc_tools.protoc -I . --python_out=. --grpc_python_out=. generated_services/interactionTypes.proto generated_services/interactionService.proto
COPY examples/grpc-service/backend.py /app/example/backend.py
COPY examples/grpc-service/tests /app/example/tests
RUN useradd --create-home --uid 1000 reflex && mkdir /data && chown reflex:reflex /data
USER reflex

FROM base AS backend
CMD ["python", "/app/example/backend.py"]

FROM base AS notebook
USER root
COPY examples/grpc-service/notebook-requirements.txt /tmp/notebook-requirements.txt
RUN pip install --no-cache-dir -r /tmp/notebook-requirements.txt
COPY --chown=reflex:reflex examples/grpc-service/notebooks /home/reflex/work
USER reflex
WORKDIR /home/reflex/work
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--ServerApp.root_dir=/home/reflex/work"]
