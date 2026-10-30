import hashlib
import json
from pathlib import Path
import unittest

import grpc
import numpy as np

from generated_services import interactionTypes_pb2 as messages
from service.interactionProcessingService import (
    InteractionProcessingServicer, extract_extrema, filter_raster, fill_missing,
    MIN_CONTRAST,
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


if __name__ == '__main__':
    unittest.main()
