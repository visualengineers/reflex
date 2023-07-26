# PythonGRPC

Python backend for image manipulation and processing. Data transmission and communication using gRPC

1. [Prerequisites](#prerequisites)
2. [Generate gRPC Code (Python)](#generate-grpc-code--python-)
3. [Run Python server](#run-python-server)
4. [Build Python server](#build-python-server)
5. [Deploy and start with electron app](#deploy-and-start-with-electron-app)

## Prerequisites

* Python > 3.5
* pip > 9.01

## PyCharm Setup

* setup a virtual environment and specify an appropriate interpreter
* create run configuration
* for debug purposes: specify environment variables for run config:
```
  GRPC_VERBOSITY=DEBUG
  GRPC_TRACE=api,client_channel_routing,cares_resolver
```

### Update pip

`python -m pip install --upgrade pip` (need admin rights)

### install packages

``` bash
  pip install -r requirements.txt     // for installing dependencies
  
  pip freeze > requirements.txt       // update requirements after after installing new packages
```

## Generate gRPC Code (Python)

* Protos are located in `python/protos`
* to generate code (`greet_pb2_grpc` and `greet_pb2`), use the terminal command:
  
```bash
  python -m grpc_tools.protoc -I . --python_out=. --grpc_python_out=. ./generated_services/*.proto --pyi_out=.

```

* this creates the grpc code in `generated_services/`
* **REMARK:** python does not allow to generate files in another directory than the proto file (see [gitHub discussion](https://github.com/protocolbuffers/protobuf/issues/1491#issuecomment-1022571406))
* **REMARK:** the `__pyi_out` flag generates metaclasses for message types(see [StackOverflow issue](https://stackoverflow.com/a/74575817)). This is not necessary for protobuf to work, but for python auto-completion
* import files using:
  
  ``` python
    from generated_services import greet_pb2, greet_pb2_grpc
  ```

## Run Python server

open Terminal and run `python main.py` from inside `python` folder

server serves on port `50051`, defined in `main.py`

implementation follows example from official [documentation](https://grpc.io/docs/languages/python/basics/)

Service is implemented in `service/interactionProcessingService.py`

## Build Python server

**TODO**: How to build an executable ?

## Deploy and start with electron app

**TODO**: Deployment / Packaging und auto-(re)start
