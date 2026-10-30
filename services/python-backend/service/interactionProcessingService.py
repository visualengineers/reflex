"""Spatial extrema extraction. Push/Pull classification belongs to ReFlex."""
import math
import os
import threading
import time
import uuid
from collections import deque
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor

import grpc
import numpy as np
from scipy import ndimage
from scipy.signal import butter, sosfiltfilt

from generated_services import interactionService_pb2_grpc, interactionTypes_pb2 as messages

PROTOCOL_VERSION = 2
MIN_CONTRAST = 0.0005
FILTER_WORKERS = max(1, min(8, int(os.getenv("REFLEX_FILTER_WORKERS", "2"))))
_FILTER_EXECUTOR = ThreadPoolExecutor(max_workers=FILTER_WORKERS, thread_name_prefix="raster-filter")


def reconstruct_raster(request):
    if request.width < 3 or request.height < 3 or request.sample_step < 1:
        raise ValueError("Require width/height >= 3 and sample_step >= 1 (protocol v2).")
    if not math.isfinite(request.zero_plane):
        raise ValueError("zero_plane must be finite.")
    count = request.width * request.height
    if request.z_float32_le:
        if request.z or len(request.z_float32_le) != count * 4:
            raise ValueError("Require exactly width * height * 4 little-endian float32 bytes and no z values.")
        # Preserve the previous float64 processing precision; avoid scalar protobuf iteration.
        raw = np.frombuffer(request.z_float32_le, dtype="<f4").astype(np.float64)
    else:
        if len(request.z) != count:
            raise ValueError("Depth count must equal width * height.")
        raw = np.asarray(request.z, dtype=np.float64)
    raw = raw.reshape(request.height, request.width)
    return raw, np.isfinite(raw)


def fill_missing(raw, valid):
    if valid.all():
        return raw.copy()
    nearest = ndimage.distance_transform_edt(~valid, return_distances=False, return_indices=True)
    return raw[tuple(nearest)]


@lru_cache(maxsize=32)
def filter_coefficients(cutoff, factor, sample_step):
    fs = factor / sample_step
    if not (math.isfinite(fs) and math.isfinite(cutoff) and 0 < cutoff < fs / 2):
        raise ValueError("Require 0 < cutoff < factor / (2 * sample_step).")
    return butter(5, cutoff, fs=fs, output="sos")


def filter_raster(data, cutoff, factor, sample_step):
    sos = filter_coefficients(cutoff, factor, sample_step)
    # Order 5 has a default SOS pad length of 18; also support small rasters.
    x_pad, y_pad = min(18, data.shape[1] - 1), min(18, data.shape[0] - 1)
    if FILTER_WORKERS == 1 or data.size < 65536 or min(data.shape) < FILTER_WORKERS:
        result = sosfiltfilt(sos, data, axis=1, padlen=x_pad)
        return sosfiltfilt(sos, result, axis=0, padlen=y_pad)
    # Split perpendicular to the filtered axis: each complete signal keeps its
    # original padding, initial conditions and forward/backward arithmetic.
    rows = np.array_split(data, FILTER_WORKERS, axis=0)
    result = np.concatenate(list(_FILTER_EXECUTOR.map(
        lambda block: sosfiltfilt(sos, block, axis=1, padlen=x_pad), rows)), axis=0)
    columns = np.array_split(result, FILTER_WORKERS, axis=1)
    filtered = _FILTER_EXECUTOR.map(
        lambda block: sosfiltfilt(sos, np.ascontiguousarray(block.T), axis=1, padlen=y_pad).T,
        columns)
    return np.concatenate(list(filtered), axis=1)


def extract_extrema(raw, filtered, valid, sample_step):
    radius = max(1, math.ceil(10 / sample_step))
    height, width = raw.shape
    found = {}
    for kind, operator in ((messages.MINIMUM, ndimage.minimum_filter),
                           (messages.MAXIMUM, ndimage.maximum_filter)):
        mask = filtered == operator(filtered, size=2 * radius + 1, mode="nearest")
        mask[[0, -1], :] = False
        mask[:, [0, -1]] = False
        labels, _ = ndimage.label(mask, structure=np.ones((3, 3)))
        for label_id, region in enumerate(ndimage.find_objects(labels), 1):
            if region is None:
                continue
            if region[0].stop - region[0].start == 1 and region[1].stop - region[1].start == 1:
                y, x = region[0].start, region[1].start
            else:
                coords = np.argwhere(labels[region] == label_id)
                # One plateau representative: closest to its centre, then row-major.
                centre = coords.mean(axis=0)
                y, x = coords[np.argmin(np.sum((coords - centre) ** 2, axis=1))]
                y += region[0].start
                x += region[1].start
            y0, y1 = max(0, y-radius), min(height, y+radius+1)
            x0, x1 = max(0, x-radius), min(width, x+radius+1)
            patch = raw[y0:y1, x0:x1]
            patch_valid = valid[y0:y1, x0:x1]
            values = patch[patch_valid]
            if not values.size:
                continue
            best = values.min() if kind == messages.MINIMUM else values.max()
            span = values.max() - best if kind == messages.MINIMUM else best - values.min()
            # Median contrast cannot exceed the range: reject flat patches cheaply.
            if span < MIN_CONTRAST:
                continue
            contrast = np.median(values) - best if kind == messages.MINIMUM else best - np.median(values)
            if contrast < MIN_CONTRAST:
                continue
            choices = np.argwhere(patch_valid & (patch == best))
            # Refine to original depth, prefer the location nearest the filtered peak.
            distance = (choices[:, 0] + y0 - y)**2 + (choices[:, 1] + x0 - x)**2
            ry, rx = choices[np.argmin(distance)] + [y0, x0]
            if ry == 0 or rx == 0 or ry == height-1 or rx == width-1:
                continue
            # Refinement must not turn a saddle/flank into a local extremum.
            neighbourhood = raw[max(0, ry-radius):ry+radius+1, max(0, rx-radius):rx+radius+1]
            finite = neighbourhood[np.isfinite(neighbourhood)]
            if (kind == messages.MINIMUM and best > finite.min()) or (kind == messages.MAXIMUM and best < finite.max()):
                continue
            index = int(ry * width + rx)
            found[(kind, index)] = float(best)
    return [(kind, index, found[(kind, index)]) for kind, index in sorted(found)]


class InteractionProcessingServicer(interactionService_pb2_grpc.InteractionProcessingServicer):
    def __init__(self):
        self.lock = threading.RLock()
        self.frame_id = 0
        self.config = {"cutoff": 2.0, "factor": 100.0}
        self.filtered = None
        self.timings = deque(maxlen=4096)
        self.timing_sequence = 0
        self.timing_session = uuid.uuid4().hex

    def record_timing(self, sample):
        """Caller holds lock. Copy records so later reports cannot mutate history."""
        self.timing_sequence += 1
        stored = messages.TimingSample()
        stored.CopyFrom(sample)
        stored.sequence = self.timing_sequence
        self.timings.append(stored)

    def GetTimings(self, request, context):
        with self.lock:
            return messages.TimingResponse(
                samples=[s for s in self.timings if s.sequence > request.after_sequence],
                latest_sequence=self.timing_sequence,
                oldest_sequence=self.timings[0].sequence if self.timings else 0,
                session_id=self.timing_session)

    def ReportTiming(self, request, context):
        with self.lock:
            # Merge into the original server record; never trust client server timings.
            original = next((s for s in reversed(self.timings) if s.frame_id == request.frame_id), None)
            if original is None:
                context.abort(grpc.StatusCode.NOT_FOUND, "Timing frame no longer retained.")
            if any(not k.startswith("client_") or not math.isfinite(v) or v < 0
                   for k, v in request.milliseconds.items()):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Require finite non-negative client_ timings.")
            sample = messages.TimingSample()
            sample.CopyFrom(original)
            sample.milliseconds.update(request.milliseconds)
            self.record_timing(sample)
            return messages.TimingAck()

    def GetState(self, request, context):
        with self.lock:
            return messages.StateResponse(isReady=True, frame_id=self.frame_id,
                                          protocol_version=PROTOCOL_VERSION,
                                          supports_float32_payload=True)

    def Configure(self, request, context):
        if not (math.isfinite(request.factor) and math.isfinite(request.cutoff)
                and 0 < request.cutoff < request.factor / 2):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Require finite 0 < cutoff < factor / 2.")
        with self.lock:
            self.config = {"cutoff": request.cutoff, "factor": request.factor}
            return messages.ConfigResponse(success=True)

    def ComputeInteractions(self, request, context):
        started = time.perf_counter_ns()
        with self.lock:
            timings = {"server_lock_wait": (time.perf_counter_ns() - started) / 1e6}
            stage = time.perf_counter_ns()
            try:
                raw, valid = reconstruct_raster(request)
                # Validate settings even when all samples are missing.
                if not 0 < self.config["cutoff"] < self.config["factor"] / (2 * request.sample_step):
                    raise ValueError("Require cutoff < factor / (2 * sample_step).")
                self.filtered = np.full(raw.shape, np.nan)
                timings["server_reconstruction"] = (time.perf_counter_ns() - stage) / 1e6
                timings.update(server_fill_missing=0.0, server_filter=0.0, server_extrema=0.0)
                candidates = []
                if valid.any():
                    stage = time.perf_counter_ns()
                    filled = fill_missing(raw, valid)
                    timings["server_fill_missing"] = (time.perf_counter_ns() - stage) / 1e6
                    stage = time.perf_counter_ns()
                    self.filtered = filter_raster(filled, sample_step=request.sample_step,
                                                  **self.config)
                    timings["server_filter"] = (time.perf_counter_ns() - stage) / 1e6
                    stage = time.perf_counter_ns()
                    candidates = extract_extrema(raw, self.filtered, valid, request.sample_step)
                    timings["server_extrema"] = (time.perf_counter_ns() - stage) / 1e6
            except ValueError as error:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(error))
            self.frame_id += 1
            timestamp = round(time.time() * 1000)
            stage = time.perf_counter_ns()
            response = messages.InteractionFrame(frame_id=self.frame_id, interactions=[
                messages.Interaction(point_idx=index, z=z, extremum_kind=kind,
                                     type=messages.NONE, touch_id=touch_id, time=timestamp)
                for touch_id, (kind, index, z) in enumerate(candidates)
            ])
            timings["server_response_construction"] = (time.perf_counter_ns() - stage) / 1e6
            timings["server_total"] = (time.perf_counter_ns() - started) / 1e6
            response.timing.CopyFrom(messages.TimingSample(
                frame_id=self.frame_id, recorded_at_unix_ms=timestamp, milliseconds=timings))
            self.record_timing(response.timing)
            return response
