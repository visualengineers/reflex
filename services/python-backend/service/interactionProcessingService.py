"""Spatial extrema extraction. Push/Pull classification belongs to ReFlex."""
import math
import threading
import time

import grpc
import numpy as np
from scipy import ndimage
from scipy.signal import butter, sosfiltfilt

from generated_services import interactionService_pb2_grpc, interactionTypes_pb2 as messages

PROTOCOL_VERSION = 2
MIN_CONTRAST = 0.0005


def reconstruct_raster(request):
    if request.width < 3 or request.height < 3 or request.sample_step < 1:
        raise ValueError("Require width/height >= 3 and sample_step >= 1 (protocol v2).")
    if len(request.z) != request.width * request.height:
        raise ValueError("Depth count must equal width * height.")
    if not math.isfinite(request.zero_plane):
        raise ValueError("zero_plane must be finite.")
    raw = np.asarray(request.z, dtype=np.float64).reshape(request.height, request.width)
    return raw, np.isfinite(raw)


def fill_missing(raw, valid):
    if valid.all():
        return raw.copy()
    nearest = ndimage.distance_transform_edt(~valid, return_distances=False, return_indices=True)
    return raw[tuple(nearest)]


def filter_raster(data, cutoff, factor, sample_step):
    fs = factor / sample_step
    if not (math.isfinite(fs) and math.isfinite(cutoff) and 0 < cutoff < fs / 2):
        raise ValueError("Require 0 < cutoff < factor / (2 * sample_step).")
    sos = butter(5, cutoff, fs=fs, output="sos")
    # Order 5 has a default SOS pad length of 18; also support small rasters.
    result = sosfiltfilt(sos, data, axis=1, padlen=min(18, data.shape[1] - 1))
    return sosfiltfilt(sos, result, axis=0, padlen=min(18, data.shape[0] - 1))


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

    def GetState(self, request, context):
        with self.lock:
            return messages.StateResponse(isReady=True, frame_id=self.frame_id,
                                          protocol_version=PROTOCOL_VERSION)

    def Configure(self, request, context):
        if not (math.isfinite(request.factor) and math.isfinite(request.cutoff)
                and 0 < request.cutoff < request.factor / 2):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Require finite 0 < cutoff < factor / 2.")
        with self.lock:
            self.config = {"cutoff": request.cutoff, "factor": request.factor}
            return messages.ConfigResponse(success=True)

    def ComputeInteractions(self, request, context):
        with self.lock:
            try:
                raw, valid = reconstruct_raster(request)
                # Validate settings even when all samples are missing.
                if not 0 < self.config["cutoff"] < self.config["factor"] / (2 * request.sample_step):
                    raise ValueError("Require cutoff < factor / (2 * sample_step).")
                self.filtered = np.full(raw.shape, np.nan)
                candidates = []
                if valid.any():
                    self.filtered = filter_raster(fill_missing(raw, valid), sample_step=request.sample_step,
                                                  **self.config)
                    candidates = extract_extrema(raw, self.filtered, valid, request.sample_step)
            except ValueError as error:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(error))
            self.frame_id += 1
            timestamp = round(time.time() * 1000)
            return messages.InteractionFrame(frame_id=self.frame_id, interactions=[
                messages.Interaction(point_idx=index, z=z, extremum_kind=kind,
                                     type=messages.NONE, touch_id=touch_id, time=timestamp)
                for touch_id, (kind, index, z) in enumerate(candidates)
            ])
