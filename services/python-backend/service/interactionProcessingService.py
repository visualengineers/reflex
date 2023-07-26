import random
import typing
import time
import logging
from os import getenv

from generated_services import interactionService_pb2_grpc, interactionTypes_pb2
from scipy.signal import butter, filtfilt
from scipy import signal as ssi

import pandas as pd
import numpy as np


class InteractionProcessingServicer(interactionService_pb2_grpc.InteractionProcessingServicer):
    __frameId: int = 0
    __cutOff: float = 0.1
    __factor: float = 100.0

    def butter_lowpass(self, cutoff, fs, order=5):
        nyq = 0.5 * fs
        normal_cutoff = cutoff / nyq
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        return b, a

    def butter_lowpass_filtfilt(self, data, cutoff, fs, order=5):
        b, a = self.butter_lowpass(cutoff, fs, order=order)
        y = filtfilt(b, a, data)
        return y

    def create_interaction(self, p_cloud: interactionTypes_pb2.PointCloud3d, t: str, idx: int, touch_id: int):

        z = p_cloud.z[idx]
        touch_type = t
        curr_time = round(time.time() * 1000)

        interaction = interactionTypes_pb2.Interaction(
            z=z, touch_id=touch_id, point_idx=idx,
            type=touch_type, time=curr_time)

        is_debug = getenv('INTERACTION_DEBUG')
        if is_debug:
            logging.info(f'FRAME {self.__frameId}: idx={idx} |  z = {z}')

        return interaction

    def GetState(self, request, context):
        result = interactionTypes_pb2.StateResponse(isReady=True, frame_id=self.__frameId)
        return result

    def Configure(self, request, context):
        cfg = typing.cast(interactionTypes_pb2.ConfigRequest, request)

        self.__cutOff = cfg.cutoff
        self.__factor = cfg.factor

        return interactionTypes_pb2.ConfigResponse(True)

    def ComputeInteractions(self, request, context):
        p_cloud = typing.cast(interactionTypes_pb2.PointCloud3d, request)

        self.__frameId += 1
        interactions = []

        filtered = self.butter_lowpass_filtfilt(p_cloud.z, self.__cutOff, self.__factor)

        prom = 0.0005
        t = 0

        peaks1d_max, _ = ssi.find_peaks(filtered, prominence=prom, threshold=t)
        peaks1d_min, _ = ssi.find_peaks(-filtered, prominence=prom, threshold=t)

        idx: int = 0

        for i in peaks1d_max:
            interaction = self.create_interaction(p_cloud, "PULL", i, idx)
            idx += 1
            interactions.append(interaction)

        for i in peaks1d_min:
            interaction = self.create_interaction(p_cloud, "PUSH", i, idx)
            idx += 1
            interactions.append(interaction)

        result = interactionTypes_pb2.InteractionFrame(
            frame_id=self.__frameId,
            interactions=interactions
        )

        is_debug = getenv('INTERACTION_DEBUG')
        if is_debug:
            logging.debug(f'return interaction frame: {result} with id {result.frame_id}')
        return result
