"""Test a private listener, never the running sensor service."""
import json
import multiprocessing
from functools import partial
from pathlib import Path
import tempfile
import time
import unittest

import grpc
import numpy as np

from backend import create_server, write_snapshot, OPTIONS
from generated_services import interactionService_pb2_grpc as rpc
from generated_services import interactionTypes_pb2 as messages
from service.interactionProcessingService import InteractionProcessingServicer


def gated_snapshot(path, payload, started, release):
    started.set()
    if not release.wait(5):
        raise RuntimeError("Test did not release the snapshot writer")
    write_snapshot(path, payload)


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

    def wait_snapshot(self, frame_id):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if self.path.exists():
                snapshot = json.loads(self.path.read_text())
                if snapshot['frame_id'] == frame_id:
                    return snapshot
            time.sleep(.01)
        self.fail(f"Snapshot for frame {frame_id} not published")

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
        snapshot = self.wait_snapshot(reply.frame_id)
        self.assertIsNone(snapshot['raw'][0])
        self.assertEqual(snapshot['width'],100)
        self.assertEqual(snapshot['height'],80)
        self.assertEqual(snapshot['sample_step'],1)
        np.testing.assert_allclose(snapshot['filtered'],expected_processor.filtered.ravel())
        second = self.client.ComputeInteractions(req, timeout=3)
        self.assertEqual(self.wait_snapshot(second.frame_id)['frame_id'],second.frame_id)
        self.assertEqual(list(self.path.parent.iterdir()),[self.path])

    def test_old_protocol_is_rejected_and_service_recovers(self):
        with self.assertRaises(grpc.RpcError) as error:
            self.client.ComputeInteractions(messages.DepthValues1d(z=[1]*32), timeout=3)
        self.assertEqual(error.exception.code(),grpc.StatusCode.INVALID_ARGUMENT)
        reply = self.client.ComputeInteractions(messages.DepthValues1d(z=[1]*9,width=3,height=3,sample_step=1),timeout=3)
        self.assertEqual(len(reply.interactions),0)

    def test_timing_history_and_client_report(self):
        baseline = self.client.GetTimings(messages.TimingRequest(), timeout=3)
        self.assertEqual(baseline.latest_sequence, 0)
        self.assertTrue(baseline.session_id)
        req = messages.DepthValues1d(z=[1]*9, width=3, height=3, sample_step=1)
        reply = self.client.ComputeInteractions(req, timeout=3)
        durations = dict(reply.timing.milliseconds)
        self.assertEqual(reply.timing.frame_id, reply.frame_id)
        self.assertTrue(all(np.isfinite(v) and v >= 0 for v in durations.values()))
        self.assertIn('server_extrema', durations)
        self.assertIn('server_snapshot_enqueue', durations)
        self.assertNotIn('snapshot_background_write', durations)
        self.assertGreaterEqual(durations['server_total'], durations['server_snapshot_enqueue'])
        self.wait_snapshot(reply.frame_id)
        batch = self.client.GetTimings(messages.TimingRequest(), timeout=3)
        for stage, value in durations.items():
            self.assertEqual(batch.samples[-1].milliseconds[stage], value)
        self.client.ReportTiming(messages.TimingSample(frame_id=reply.frame_id,
            milliseconds={'client_rpc_roundtrip': 12.5}), timeout=3)
        updated = self.client.GetTimings(messages.TimingRequest(after_sequence=batch.latest_sequence), timeout=3)
        self.assertGreaterEqual(len(updated.samples), 1)
        self.assertEqual(updated.samples[-1].milliseconds['client_rpc_roundtrip'], 12.5)
        self.assertEqual(updated.samples[-1].milliseconds['server_total'], durations['server_total'])
        self.assertNotIn('client_rpc_roundtrip', batch.samples[-1].milliseconds)
        self.assertEqual(len(self.client.GetTimings(messages.TimingRequest(
            after_sequence=updated.latest_sequence), timeout=3).samples), 0)
        for measurements in ({'server_total': 0}, {'client_bad': -1}, {'client_bad': float('nan')}):
            with self.assertRaises(grpc.RpcError) as error:
                self.client.ReportTiming(messages.TimingSample(frame_id=reply.frame_id,
                    milliseconds=measurements), timeout=3)
            self.assertEqual(error.exception.code(), grpc.StatusCode.INVALID_ARGUMENT)
        with self.assertRaises(grpc.RpcError) as error:
            self.client.ReportTiming(messages.TimingSample(frame_id=reply.frame_id + 1), timeout=3)
        self.assertEqual(error.exception.code(), grpc.StatusCode.NOT_FOUND)

    def test_blocked_snapshot_does_not_block_rpc_and_pending_frames_are_replaced(self):
        self.server.stop(0).wait()
        self.channel.close()
        ctx = multiprocessing.get_context('spawn')
        started, release = ctx.Event(), ctx.Event()
        self.server, port = create_server(self.path, '127.0.0.1:0',
            writer=partial(gated_snapshot, started=started, release=release))
        self.server.start()
        self.channel = grpc.insecure_channel(f'127.0.0.1:{port}', options=OPTIONS)
        self.client = rpc.InteractionProcessingStub(self.channel)
        try:
            req = messages.DepthValues1d(z=[1]*9, width=3, height=3, sample_step=1)
            first = self.client.ComputeInteractions(req, timeout=3)
            self.assertTrue(started.wait(3))
            # The worker is blocked, but processing, config and diagnostics remain available.
            for depth in (2, 3, 4):
                req.z[:] = [depth]*9
                latest = self.client.ComputeInteractions(req, timeout=3)
                time.sleep(.02)  # Allow the multiprocessing feeder to make pending data visible.
            self.assertEqual(latest.frame_id, first.frame_id + 3)
            self.assertFalse(release.is_set())
            self.assertFalse(self.path.exists())
            state = self.client.GetState(messages.StateRequest(), timeout=3)
            self.assertEqual(state.frame_id, latest.frame_id)
            release.set()
            snapshot = self.wait_snapshot(latest.frame_id)
            self.assertEqual(snapshot['raw'], [4]*9)
            np.testing.assert_allclose(snapshot['filtered'], [4]*9)
        finally:
            release.set()
        worker = self.server.processor.publisher.process
        self.server.stop(0).wait()
        self.assertFalse(worker.is_alive())

    def test_timing_buffer_is_bounded_and_restart_has_new_session(self):
        processor = InteractionProcessingServicer()
        with processor.lock:
            for frame in range(4100):
                processor.record_timing(messages.TimingSample(frame_id=frame))
        batch = processor.GetTimings(messages.TimingRequest(), None)
        self.assertEqual(len(batch.samples), 4096)
        self.assertEqual(batch.oldest_sequence, 5)
        self.assertEqual(batch.latest_sequence, 4100)
        self.assertNotEqual(batch.session_id, InteractionProcessingServicer().timing_session)
