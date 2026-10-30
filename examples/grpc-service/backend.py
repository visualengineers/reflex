"""Observe the existing Python processor without changing the gRPC contract."""
import json
import logging
import math
import os
from pathlib import Path
import signal
import sys
import threading
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
        self.snapshot_path = Path(snapshot_path)
        self.lock = threading.RLock()
        self.filtered = []
        self.config = {"cutoff": 0.1, "factor": 100.0}

    def butter_lowpass_filtfilt(self, data, cutoff, fs, order=5):
        # Capture the actual intermediate result; do not duplicate the algorithm.
        result = super().butter_lowpass_filtfilt(data, cutoff, fs, order)
        self.filtered = result.tolist()
        return result

    def Configure(self, request, context):
        if not (math.isfinite(request.factor) and math.isfinite(request.cutoff)
                and 0 < request.cutoff < request.factor / 2):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Require finite 0 < cutoff < factor / 2.")
        with self.lock:
            response = super().Configure(request, context)
            self.config = {"cutoff": request.cutoff, "factor": request.factor}
            return response

    def GetState(self, request, context):
        with self.lock:
            return super().GetState(request, context)

    def ComputeInteractions(self, request, context):
        # scipy's order-5 filtfilt requires more than 18 samples.
        if len(request.z) <= 18 or not np.isfinite(request.z).all():
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Provide at least 19 finite depth samples.")
        with self.lock:
            response = super().ComputeInteractions(request, context)
            snapshot = {
                "frame_id": response.frame_id,
                "received_at": time.time(),
                "config": self.config.copy(),
                "raw": list(request.z),
                "filtered": self.filtered,
                "interactions": [
                    {"point_idx": i.point_idx, "z": i.z, "touch_id": i.touch_id,
                     "type": messages.InteractionType.Name(i.type), "time": i.time}
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
        if not state.isReady:
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
