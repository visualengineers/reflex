"""Test a private listener, never the running sensor service."""
import json
from pathlib import Path
import tempfile
import unittest

import grpc
import numpy as np

from backend import create_server, OPTIONS
from generated_services import interactionService_pb2_grpc as rpc
from generated_services import interactionTypes_pb2 as messages
from service.interactionProcessingService import InteractionProcessingServicer


class BackendTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "latest.json"
        self.server, port = create_server(self.path, "127.0.0.1:0")
        self.server.start()
        self.channel = grpc.insecure_channel(f"127.0.0.1:{port}", options=OPTIONS)
        self.client = rpc.InteractionProcessingStub(self.channel)

    def tearDown(self):
        self.channel.close()
        self.server.stop(0).wait()
        self.directory.cleanup()

    def test_extraction_and_atomic_snapshot(self):
        state = self.client.GetState(messages.StateRequest(), timeout=3)
        self.assertTrue(state.isReady)
        self.assertEqual(state.protocol_version, 2)
        cfg = messages.ConfigRequest(cutoff=2, factor=100)
        self.assertTrue(self.client.Configure(cfg, timeout=3).success)
        y,x = np.mgrid[:80,:100]
        raw = 1.45 - .1*np.exp(-((x-40)**2+(y-40)**2)/100)
        raw[0,0] = np.nan
        req = messages.DepthValues1d(z=raw.ravel(),width=100,height=80,sample_step=1,zero_plane=1.45)
        expected_processor = InteractionProcessingServicer()
        expected = expected_processor.ComputeInteractions(req, None)
        reply = self.client.ComputeInteractions(req, timeout=3)
        self.assertGreater(len(reply.interactions), 0)
        self.assertEqual([(i.point_idx,i.z,i.extremum_kind) for i in reply.interactions],
                         [(i.point_idx,i.z,i.extremum_kind) for i in expected.interactions])
        snapshot = json.loads(self.path.read_text())
        self.assertIsNone(snapshot['raw'][0])
        self.assertEqual(snapshot['width'],100)
        self.assertEqual(snapshot['height'],80)
        self.assertEqual(snapshot['sample_step'],1)
        np.testing.assert_allclose(snapshot['filtered'],expected_processor.filtered.ravel())
        second = self.client.ComputeInteractions(req, timeout=3)
        self.assertEqual(json.loads(self.path.read_text())['frame_id'],second.frame_id)
        self.assertEqual(list(self.path.parent.iterdir()),[self.path])

    def test_old_protocol_is_rejected_and_service_recovers(self):
        with self.assertRaises(grpc.RpcError) as error:
            self.client.ComputeInteractions(messages.DepthValues1d(z=[1]*32), timeout=3)
        self.assertEqual(error.exception.code(),grpc.StatusCode.INVALID_ARGUMENT)
        reply = self.client.ComputeInteractions(messages.DepthValues1d(z=[1]*9,width=3,height=3,sample_step=1),timeout=3)
        self.assertEqual(len(reply.interactions),0)
