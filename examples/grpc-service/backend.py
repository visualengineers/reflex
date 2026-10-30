"""Observe the existing Python processor without changing the gRPC contract."""
import json
import logging
import os
from pathlib import Path
import signal
import sys
import time
from concurrent import futures

import grpc
import numpy as np

from generated_services import interactionService_pb2_grpc as rpc
from generated_services import interactionTypes_pb2 as messages
from service.interactionProcessingService import InteractionProcessingServicer

MAX_MESSAGE_LENGTH = 8 * 1024 * 1024
OPTIONS = [("grpc.max_receive_message_length", MAX_MESSAGE_LENGTH),
           ("grpc.max_send_message_length", MAX_MESSAGE_LENGTH)]


class ObservedProcessor(InteractionProcessingServicer):
    def __init__(self, snapshot_path):
        super().__init__()
        self.snapshot_path = Path(snapshot_path)

    def ComputeInteractions(self, request, context):
        with self.lock:
            response = super().ComputeInteractions(request, context)
            snapshot = {
                "frame_id": response.frame_id,
                "received_at": time.time(),
                "config": self.config.copy(),
                "width": request.width, "height": request.height,
                "sample_step": request.sample_step, "zero_plane": request.zero_plane,
                "raw": [float(v) if np.isfinite(v) else None for v in request.z],
                "filtered": [float(v) if np.isfinite(v) else None for v in self.filtered.ravel()],
                "interactions": [
                    {"point_idx": i.point_idx, "z": i.z, "touch_id": i.touch_id,
                     "type": messages.InteractionType.Name(i.type),
                     "extremum_kind": messages.ExtremumKind.Name(i.extremum_kind), "time": i.time}
                    for i in response.interactions
                ],
            }
            # Replace a single file atomically: no partial frames or growing queue.
            try:
                self.snapshot_path.parent.mkdir(parents=True, exist_ok=True)
                temporary = self.snapshot_path.with_suffix(".tmp")
                temporary.write_text(json.dumps(snapshot, allow_nan=False), encoding="utf-8")
                os.replace(temporary, self.snapshot_path)
            except (OSError, ValueError):
                logging.exception("Could not publish notebook snapshot")
            return response


def create_server(snapshot_path, address="[::]:50051"):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4), options=OPTIONS)
    rpc.add_InteractionProcessingServicer_to_server(ObservedProcessor(snapshot_path), server)
    port = server.add_insecure_port(address)
    if not port:
        raise RuntimeError(f"Could not bind {address}")
    return server, port


def healthcheck():
    with grpc.insecure_channel("localhost:50051", options=OPTIONS) as channel:
        state = rpc.InteractionProcessingStub(channel).GetState(messages.StateRequest(), timeout=2)
        if not state.isReady or state.protocol_version != 2:
            raise RuntimeError("Processor not ready")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if "--healthcheck" in sys.argv:
        healthcheck()
    else:
        path = Path(os.getenv("SNAPSHOT_PATH", "/data/latest.json"))
        path.unlink(missing_ok=True)  # Do not show a frame from an earlier run.
        server, _ = create_server(path)
        for sig in (signal.SIGTERM, signal.SIGINT):
            signal.signal(sig, lambda *_: server.stop(2))
        server.start()
        logging.info("ReFlex gRPC processor listening on :50051")
        server.wait_for_termination()
