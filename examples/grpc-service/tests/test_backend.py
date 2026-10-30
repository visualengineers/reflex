"""Integration checks against a real gRPC listener and the existing processor."""
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

    def configure(self):
        cfg = messages.ConfigRequest(cutoff=2, factor=100)
        self.assertTrue(self.client.Configure(cfg, timeout=3).success)
        return cfg

    def test_extraction_and_snapshot_match_existing_processor(self):
        self.assertTrue(self.client.GetState(messages.StateRequest(), timeout=3).isReady)
        cfg = self.configure()
        x = np.linspace(0, 8 * np.pi, 1024)
        request = messages.DepthValues1d(z=(1 + 0.03 * np.sin(x)).tolist())
        expected_processor = InteractionProcessingServicer()
        expected_processor.Configure(cfg, None)
        expected = expected_processor.ComputeInteractions(request, None)
        reply = self.client.ComputeInteractions(request, timeout=3)
        self.assertGreater(len(reply.interactions), 0)
        self.assertEqual([(i.point_idx, i.z, i.type) for i in reply.interactions],
                         [(i.point_idx, i.z, i.type) for i in expected.interactions])
        snapshot = json.loads(self.path.read_text())
        self.assertEqual(snapshot["raw"], list(request.z))
        self.assertEqual(snapshot["frame_id"], reply.frame_id)
        np.testing.assert_allclose(snapshot["filtered"],
                                   expected_processor.butter_lowpass_filtfilt(request.z, 2, 100))
        self.assertEqual([i["point_idx"] for i in snapshot["interactions"]],
                         [i.point_idx for i in reply.interactions])
        second = self.client.ComputeInteractions(request, timeout=3)
        self.assertEqual(json.loads(self.path.read_text())["frame_id"], second.frame_id)
        self.assertEqual(list(self.path.parent.iterdir()), [self.path])

    def test_invalid_requests_are_rejected_and_service_recovers(self):
        for samples in ([], [1.0] * 18, [float("nan")] * 32, [float("inf")] * 32):
            with self.assertRaises(grpc.RpcError) as error:
                self.client.ComputeInteractions(messages.DepthValues1d(z=samples), timeout=3)
            self.assertEqual(error.exception.code(), grpc.StatusCode.INVALID_ARGUMENT)
        for cutoff, factor in ((0, 100), (50, 100), (1, -1), (float("nan"), 100)):
            with self.assertRaises(grpc.RpcError) as error:
                self.client.Configure(messages.ConfigRequest(cutoff=cutoff, factor=factor), timeout=3)
            self.assertEqual(error.exception.code(), grpc.StatusCode.INVALID_ARGUMENT)
        self.configure()
        reply = self.client.ComputeInteractions(messages.DepthValues1d(z=[1.0] * 32), timeout=3)
        self.assertEqual(len(reply.interactions), 0)
        self.assertTrue(self.path.exists())


if __name__ == "__main__":
    unittest.main()
