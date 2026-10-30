"""Observe the existing Python processor without changing the gRPC contract."""
import json
import logging
import multiprocessing
import os
from pathlib import Path
import signal
import sys
import threading
from queue import Empty, Full
import time
from concurrent import futures

import grpc
import numpy as np

from generated_services import interactionService_pb2_grpc as rpc
from generated_services import interactionTypes_pb2 as messages
from service.interactionProcessingService import InteractionProcessingServicer, reconstruct_raster

MAX_MESSAGE_LENGTH = 8 * 1024 * 1024
OPTIONS = [("grpc.max_receive_message_length", MAX_MESSAGE_LENGTH),
           ("grpc.max_send_message_length", MAX_MESSAGE_LENGTH),
           # Requests contain ~1.2 MB at 640x480: advertise larger DATA frames
           # and stream read-ahead instead of many small transfer bursts.
           ("grpc.http2.max_frame_size", 1024 * 1024),
           ("grpc.http2.lookahead_bytes", 2 * 1024 * 1024)]


def write_snapshot(path, payload):
    """Runs only in the snapshot process, including all JSON/list construction."""
    request, response, filtered, config, received_at = payload
    raw, _ = reconstruct_raster(request)
    snapshot = {
        "frame_id": response.frame_id,
        "received_at": received_at,
        "config": config,
        "width": request.width, "height": request.height,
        "sample_step": request.sample_step, "zero_plane": request.zero_plane,
        "timings_ms": dict(response.timing.milliseconds),
        "raw": [float(v) if np.isfinite(v) else None for v in raw.ravel()],
        "filtered": [float(v) if np.isfinite(v) else None for v in filtered.ravel()],
        "interactions": [
            {"point_idx": i.point_idx, "z": i.z, "touch_id": i.touch_id,
             "type": messages.InteractionType.Name(i.type),
             "extremum_kind": messages.ExtremumKind.Name(i.extremum_kind), "time": i.time}
            for i in response.interactions
        ],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, allow_nan=False), encoding="utf-8")
    os.replace(temporary, path)


def snapshot_worker(path, pending, completed, stopping, ready, writer):
    while True:
        try:
            payload = pending.get(timeout=0.1)
        except Empty:
            if stopping.is_set():
                return
            continue
        started = time.perf_counter_ns()
        try:
            try:
                writer(path, payload)
            except Exception:
                logging.exception("Could not publish notebook snapshot")
                continue
            elapsed = (time.perf_counter_ns() - started) / 1e6
            try:
                completed.put_nowait((payload[1].frame_id, elapsed))
            except Full:
                pass  # Bounded diagnostics too; never block snapshot publication.
        finally:
            ready.release()


class SnapshotPublisher:
    """Coalesce references locally; transfer only when the snapshot process is ready."""
    def __init__(self, path, writer=write_snapshot):
        ctx = multiprocessing.get_context("spawn")
        self.pending = ctx.Queue(maxsize=1)
        self.completed = ctx.Queue(maxsize=64)
        self.stopping = ctx.Event()
        self.ready = ctx.Semaphore(1)
        self._condition = threading.Condition()
        self._latest = None
        self._closing = False
        self._abort_dispatch = threading.Event()
        self.process = ctx.Process(target=snapshot_worker,
            args=(Path(path), self.pending, self.completed, self.stopping, self.ready, writer), daemon=True)
        self.process.start()
        self._dispatcher = threading.Thread(target=self._dispatch, name="snapshot-dispatch", daemon=True)
        self._dispatcher.start()

    def submit(self, payload):
        with self._condition:
            if self._closing:
                return
            # Replacing references is constant work. In particular, never receive
            # or unpickle a multi-megabyte stale frame on the gRPC handler thread.
            self._latest = payload
            self._condition.notify()

    def _dispatch(self):
        while not self._abort_dispatch.is_set():
            with self._condition:
                self._condition.wait_for(lambda: self._latest is not None or self._closing)
                if self._latest is None and self._closing:
                    return
            if not self.ready.acquire(timeout=0.1):
                continue
            with self._condition:
                payload, self._latest = self._latest, None
            try:
                self.pending.put_nowait(payload)
            except (Full, ValueError):
                self.ready.release()
                logging.exception("Could not dispatch notebook snapshot")

    def collect(self):
        while True:
            try:
                yield self.completed.get_nowait()
            except Empty:
                return

    def close(self):
        with self._condition:
            self._closing = True
            self._condition.notify_all()
        self._dispatcher.join(timeout=3)
        if self._dispatcher.is_alive():
            self._abort_dispatch.set()
            self._dispatcher.join(timeout=0.5)
        self.stopping.set()
        self.process.join(timeout=3)
        if self.process.is_alive():
            logging.warning("Snapshot worker did not stop in time; terminating it")
            self.process.terminate()
            self.process.join()
        for queue in (self.pending, self.completed):
            queue.cancel_join_thread()
            queue.close()


class ObservedProcessor(InteractionProcessingServicer):
    def __init__(self, snapshot_path, writer=write_snapshot):
        super().__init__()
        self.publisher = SnapshotPublisher(snapshot_path, writer)

    def ComputeInteractions(self, request, context):
        started = time.perf_counter_ns()
        with self.lock:
            lock_wait = (time.perf_counter_ns() - started) / 1e6
            response = super().ComputeInteractions(request, context)
            enqueue_started = time.perf_counter_ns()
            # Own immutable frame references: the processor replaces filtered/config
            # on subsequent frames. Clone the small response before adding RPC timings.
            snapshot_response = messages.InteractionFrame()
            snapshot_response.CopyFrom(response)
            self.publisher.submit((request, snapshot_response, self.filtered,
                                   self.config.copy(), time.time()))
            response.timing.milliseconds["server_snapshot_enqueue"] = (time.perf_counter_ns() - enqueue_started) / 1e6
            response.timing.milliseconds["server_lock_wait"] += lock_wait
            response.timing.milliseconds["server_total"] = (time.perf_counter_ns() - started) / 1e6
            self.record_timing(response.timing)
            return response

    def GetTimings(self, request, context):
        with self.lock:
            for frame_id, elapsed in self.publisher.collect():
                original = next((s for s in reversed(self.timings) if s.frame_id == frame_id), None)
                if original is not None:
                    sample = messages.TimingSample()
                    sample.CopyFrom(original)
                    sample.milliseconds["snapshot_background_write"] = elapsed
                    self.record_timing(sample)
            return super().GetTimings(request, context)


class ObservedServer:
    """Wait for active RPCs and stop the owned worker before signalling shutdown."""
    def __init__(self, server, processor):
        self.server = server
        self.processor = processor
        self._stopped = threading.Event()
        self._stop_lock = threading.Lock()
        self._stopping = False

    def start(self):
        self.server.start()

    def stop(self, grace):
        with self._stop_lock:
            finished = self.server.stop(grace)
            if not self._stopping:
                self._stopping = True
                def finish():
                    try:
                        finished.wait()
                        self.processor.publisher.close()
                    finally:
                        self._stopped.set()
                threading.Thread(target=finish, daemon=True).start()
        return self._stopped

    def wait_for_termination(self, timeout=None):
        return self.server.wait_for_termination(timeout)


def create_server(snapshot_path, address="[::]:50051", writer=write_snapshot):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4), options=OPTIONS)
    port = server.add_insecure_port(address)
    if not port:
        raise RuntimeError(f"Could not bind {address}")
    processor = ObservedProcessor(snapshot_path, writer)
    rpc.add_InteractionProcessingServicer_to_server(processor, server)
    return ObservedServer(server, processor), port


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
        try:
            server.wait_for_termination()
        finally:
            server.stop(0).wait()
