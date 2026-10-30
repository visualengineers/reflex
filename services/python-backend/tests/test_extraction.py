import hashlib
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import grpc
import numpy as np

from generated_services import interactionTypes_pb2 as messages
from service.interactionProcessingService import (
    InteractionProcessingServicer, extract_extrema, filter_raster, fill_missing,
    MIN_CONTRAST,
    reconstruct_raster, filter_coefficients,
)


class InvalidRequest(Exception):
    pass


class Context:
    def abort(self, code, detail):
        assert code == grpc.StatusCode.INVALID_ARGUMENT
        raise InvalidRequest(detail)


def request(raw, step=1):
    return messages.DepthValues1d(width=raw.shape[1], height=raw.shape[0],
                                  sample_step=step, zero_plane=1.45, z=raw.ravel())


class ExtractionTest(unittest.TestCase):
    def setUp(self):
        self.processor = InteractionProcessingServicer()

    def test_byte_payload_matches_repeated_float_frames(self):
        y, x = np.mgrid[:60, :80]
        raw = (1.45 - .1*np.exp(-((x-35)**2+(y-30)**2)/100)).astype('<f4')
        for missing in (False, True):
            for step in (1, 2, 4):
                with self.subTest(missing=missing, step=step):
                    frame = raw[::step, ::step].copy()
                    if missing:
                        frame[0, 0] = np.nan
                        frame[-1, -1] = np.inf
                    legacy = request(frame, step)
                    binary = messages.DepthValues1d(width=frame.shape[1], height=frame.shape[0],
                        sample_step=step, zero_plane=1.45, z_float32_le=frame.astype('<f4').tobytes())
                    for actual, expected in zip(reconstruct_raster(binary), reconstruct_raster(legacy)):
                        np.testing.assert_array_equal(actual, expected)
                    a = self.processor.ComputeInteractions(legacy, Context())
                    filtered = self.processor.filtered.copy()
                    b = self.processor.ComputeInteractions(binary, Context())
                    self.assertEqual([(i.point_idx, i.z, i.extremum_kind) for i in a.interactions],
                                     [(i.point_idx, i.z, i.extremum_kind) for i in b.interactions])
                    np.testing.assert_array_equal(self.processor.filtered, filtered)
        missing = np.full((10, 10), np.nan, dtype='<f4')
        reply = self.processor.ComputeInteractions(messages.DepthValues1d(width=10, height=10,
            sample_step=1, z_float32_le=missing.tobytes()), Context())
        self.assertEqual(len(reply.interactions), 0)

    def test_invalid_and_ambiguous_byte_payloads_are_rejected(self):
        for payload, depths in ((b'\x00', []), (b'\x00'*32, []), (b'\x00'*40, []),
                                (b'\x00'*36, [1]*9)):
            with self.subTest(length=len(payload), mixed=bool(depths)):
                with self.assertRaises(InvalidRequest):
                    self.processor.ComputeInteractions(messages.DepthValues1d(width=3, height=3,
                        sample_step=1, z_float32_le=payload, z=depths), Context())

    def test_coefficients_are_reused_and_keyed_by_all_settings(self):
        from scipy.signal import butter
        filter_coefficients.cache_clear()
        try:
            with patch('service.interactionProcessingService.butter', wraps=butter) as design:
                data = np.ones((30, 40))
                first = filter_raster(data, 2, 100, 1)
                np.testing.assert_array_equal(filter_raster(data, 2, 100, 1), first)
                self.assertEqual(design.call_count, 1)
                for cutoff, factor, step in ((3, 100, 1), (2, 120, 1), (2, 100, 2)):
                    filter_raster(data, cutoff, factor, step)
                self.assertEqual(design.call_count, 4)
        finally:
            filter_coefficients.cache_clear()

    def test_recorded_frame(self):
        path = Path(__file__).parent / 'fixtures/three-deformations.csv'
        metadata = json.loads(path.with_suffix('.json').read_text())
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), metadata['sha256'])
        full = np.loadtxt(path, delimiter=',')
        self.assertEqual(full.shape, (metadata['height'], metadata['width']))
        for step in (1, 2, 4):
            with self.subTest(step=step):
                raw = full[::step, ::step]
                reply = self.processor.ComputeInteractions(request(raw, step), Context())
                expected_filtered = self.processor.filtered.copy()
                binary_reply = self.processor.ComputeInteractions(messages.DepthValues1d(
                    width=raw.shape[1], height=raw.shape[0], sample_step=step, zero_plane=1.45,
                    z_float32_le=raw.astype('<f4').tobytes()), Context())
                self.assertEqual([(i.point_idx, i.z, i.extremum_kind) for i in reply.interactions],
                                 [(i.point_idx, i.z, i.extremum_kind) for i in binary_reply.interactions])
                np.testing.assert_array_equal(self.processor.filtered, expected_filtered)
                coords = [(i, (i.point_idx % raw.shape[1])*step, (i.point_idx // raw.shape[1])*step)
                          for i in reply.interactions]
                for expected in metadata['expected']:
                    tolerance = 3 if step == 1 else 3 + step
                    nearby = [(i, x, y) for i, x, y in coords
                              if abs(x-expected['x']) <= tolerance and abs(y-expected['y']) <= tolerance]
                    self.assertEqual(len(nearby), 1, (expected, coords))
                    i, x, y = nearby[0]
                    self.assertEqual(messages.ExtremumKind.Name(i.extremum_kind), expected['kind'])
                    self.assertEqual(i.z, np.float32(full[y, x]))
                    self.assertEqual('PUSH' if i.z < metadata['zero_plane'] else 'PULL', expected['type'])
                # Every extra candidate must be a supported original-data extremum.
                radius = max(1, int(np.ceil(10 / step)))
                for i, _, _ in coords:
                    y, x = divmod(i.point_idx, raw.shape[1])
                    patch = raw[max(0,y-radius):y+radius+1, max(0,x-radius):x+radius+1]
                    if i.extremum_kind == messages.MINIMUM:
                        self.assertEqual(i.z, np.float32(patch.min()))
                        self.assertGreaterEqual(np.median(patch)-i.z, MIN_CONTRAST)
                    else:
                        self.assertEqual(i.z, np.float32(patch.max()))
                        self.assertGreaterEqual(i.z-np.median(patch), MIN_CONTRAST)
                    self.assertEqual(i.type, messages.NONE)

    def test_flat_missing_and_short_rasters(self):
        for raw in (np.full((48,64),1.45), np.full((48,64),np.nan), np.ones((3,3))):
            reply = self.processor.ComputeInteractions(request(raw), Context())
            self.assertEqual(len(reply.interactions), 0)
        raw = np.ones((48,64)); raw[20:25,30:35] = np.nan
        self.assertEqual(len(self.processor.ComputeInteractions(request(raw), Context()).interactions), 0)
        self.assertTrue(np.isfinite(self.processor.filtered).all())

    def test_missing_frame_timings_do_not_reuse_previous_values(self):
        self.processor.ComputeInteractions(request(np.ones((20, 20))), Context())
        reply = self.processor.ComputeInteractions(request(np.full((20, 20), np.nan)), Context())
        timing = reply.timing.milliseconds
        for stage in ('server_fill_missing', 'server_filter', 'server_extrema'):
            self.assertEqual(timing[stage], 0)
        self.assertGreater(timing['server_total'], 0)
        self.assertGreaterEqual(timing['server_total'], sum(v for k, v in timing.items() if k != 'server_total'))

    def test_nan_hole_never_receives_candidate(self):
        y,x = np.mgrid[:80,:80]
        raw = 1.45 - .1*np.exp(-((x-40)**2+(y-40)**2)/100)
        raw[40,40] = np.nan
        reply = self.processor.ComputeInteractions(request(raw), Context())
        self.assertGreater(len(reply.interactions), 0)
        self.assertTrue(all(np.isfinite(raw.ravel()[i.point_idx]) for i in reply.interactions))

    def test_plateau_is_deterministic_and_saddle_is_not_an_extremum(self):
        raw = np.ones((61,61)); raw[29:32,29:32] = .8
        candidates = extract_extrema(raw, raw, np.isfinite(raw), 1)
        self.assertEqual(candidates, [(messages.MINIMUM, 30*61+30, .8)])
        y,x = np.mgrid[-30:31,-30:31]; raw = (x*x-y*y).astype(float)
        self.assertFalse(any(index == 30*61+30 for _,index,_ in extract_extrema(raw,raw,np.isfinite(raw),1)))

    def test_isolated_extrema_and_plateau_ties_keep_the_same_coordinates(self):
        shapes = (
            ([(20, 20)], (20, 20)),
            ([(29, 29), (30, 30)], (29, 29)),  # Diagonal pixels form one 8-connected plateau.
            ([(29, 29), (29, 30), (30, 29)], (29, 29)),
            ([(y, x) for y in range(29, 31) for x in range(28, 32)], (29, 29)),
        )
        for coordinates, expected in shapes:
            with self.subTest(coordinates=coordinates):
                raw = np.ones((61, 61))
                for y, x in coordinates:
                    raw[y, x] = .8
                candidates = extract_extrema(raw, raw, np.isfinite(raw), 1)
                self.assertEqual(candidates, [(messages.MINIMUM, expected[0]*61+expected[1], .8)])
        raw = np.ones((61, 61))
        raw[15, 15] = .8
        raw[45, 45] = .7
        self.assertEqual(extract_extrema(raw, raw, np.isfinite(raw), 1),
                         [(messages.MINIMUM, 15*61+15, .8), (messages.MINIMUM, 45*61+45, .7)])

    def test_parallel_extrema_match_known_peaks_for_multiple_memory_layouts(self):
        raw = np.ones((257, 259))
        raw[70, 60] = .8
        raw[180, 190] = 1.2
        expected = [(messages.MINIMUM, 70*259+60, .8), (messages.MAXIMUM, 180*259+190, 1.2)]
        for filtered in (raw.copy(order='C'), raw.copy(order='F'), raw[::-1].copy()[::-1]):
            with self.subTest(strides=filtered.strides):
                np.testing.assert_array_equal(filtered, raw)
                self.assertEqual(extract_extrema(raw, filtered, np.isfinite(raw), 1), expected)

    def test_invalid_requests_and_configuration(self):
        for req in (messages.DepthValues1d(z=[1]*32),
                    messages.DepthValues1d(width=3,height=3,sample_step=1,z=[1]*8),
                    request(np.ones((2,3))), request(np.ones((3,3)),0),
                    request(np.ones((3,3)),30)):
            with self.assertRaises(InvalidRequest):
                self.processor.ComputeInteractions(req, Context())
        for cutoff,factor in ((0,100),(50,100),(1,-1),(float('nan'),100)):
            with self.assertRaises(InvalidRequest):
                self.processor.Configure(messages.ConfigRequest(cutoff=cutoff,factor=factor),Context())
        self.assertTrue(self.processor.Configure(messages.ConfigRequest(cutoff=2,factor=100),Context()).success)

    def test_sos_constant_preserves_zero_plane(self):
        raw = np.full((480,640),1.45)
        np.testing.assert_allclose(filter_raster(raw,.1,100,1),raw,atol=1e-9,rtol=0)

    def test_parallel_filter_preserves_serial_results_and_input(self):
        from scipy.signal import sosfiltfilt
        rng = np.random.default_rng(640480)
        for shape, cutoff, factor, step in (((480, 640), 2, 100, 1),
                                           ((257, 259), 2, 100, 2),
                                           ((3, 22000), .1, 1200, 1)):
            with self.subTest(shape=shape, step=step):
                data = 1.45 + rng.normal(0, .01, size=shape)
                original = data.copy()
                sos = filter_coefficients(cutoff, factor, step)
                expected = sosfiltfilt(sos, data, axis=1, padlen=min(18, shape[1]-1))
                expected = sosfiltfilt(sos, expected, axis=0, padlen=min(18, shape[0]-1))
                actual = filter_raster(data, cutoff, factor, step)
                np.testing.assert_array_equal(actual, expected)
                np.testing.assert_array_equal(data, original)


if __name__ == '__main__':
    unittest.main()
