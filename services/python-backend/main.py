# Copyright 2015 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""The Python implementation of the GRPC helloworld.Greeter client."""

from __future__ import print_function

import logging
from concurrent import futures

import grpc
from generated_services import interactionService_pb2_grpc
from service import interactionProcessingService as service

port = 50051

MAX_MESSAGE_LENGTH = 8 * 1024 * 1024

def run():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10), options=[
        ('grpc.max_send_message_length', MAX_MESSAGE_LENGTH),
        ('grpc.max_receive_message_length', MAX_MESSAGE_LENGTH),
    ],)
    interactionService_pb2_grpc.add_InteractionProcessingServicer_to_server(
        service.InteractionProcessingServicer(), server)
    address = f'[::]:{port}'
    server.add_insecure_port(address)

    logging.info(F'Start server at {address}...')
    server.start()
    logging.info(F'Server successfully started.')
    server.wait_for_termination()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run()


