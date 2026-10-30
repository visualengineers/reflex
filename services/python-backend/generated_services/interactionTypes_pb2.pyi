from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor
MAXIMUM: ExtremumKind
MINIMUM: ExtremumKind
NONE: InteractionType
PULL: InteractionType
PUSH: InteractionType
UNSPECIFIED: ExtremumKind

class ConfigRequest(_message.Message):
    __slots__ = ["cutoff", "factor"]
    CUTOFF_FIELD_NUMBER: _ClassVar[int]
    FACTOR_FIELD_NUMBER: _ClassVar[int]
    cutoff: float
    factor: float
    def __init__(self, factor: _Optional[float] = ..., cutoff: _Optional[float] = ...) -> None: ...

class ConfigResponse(_message.Message):
    __slots__ = ["success"]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class DepthValues1d(_message.Message):
    __slots__ = ["height", "max_depth", "min_depth", "sample_step", "width", "z", "zero_plane"]
    HEIGHT_FIELD_NUMBER: _ClassVar[int]
    MAX_DEPTH_FIELD_NUMBER: _ClassVar[int]
    MIN_DEPTH_FIELD_NUMBER: _ClassVar[int]
    SAMPLE_STEP_FIELD_NUMBER: _ClassVar[int]
    WIDTH_FIELD_NUMBER: _ClassVar[int]
    ZERO_PLANE_FIELD_NUMBER: _ClassVar[int]
    Z_FIELD_NUMBER: _ClassVar[int]
    height: int
    max_depth: float
    min_depth: float
    sample_step: int
    width: int
    z: _containers.RepeatedScalarFieldContainer[float]
    zero_plane: float
    def __init__(self, zero_plane: _Optional[float] = ..., min_depth: _Optional[float] = ..., max_depth: _Optional[float] = ..., z: _Optional[_Iterable[float]] = ..., width: _Optional[int] = ..., height: _Optional[int] = ..., sample_step: _Optional[int] = ...) -> None: ...

class Interaction(_message.Message):
    __slots__ = ["extremum_kind", "point_idx", "time", "touch_id", "type", "z"]
    EXTREMUM_KIND_FIELD_NUMBER: _ClassVar[int]
    POINT_IDX_FIELD_NUMBER: _ClassVar[int]
    TIME_FIELD_NUMBER: _ClassVar[int]
    TOUCH_ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    Z_FIELD_NUMBER: _ClassVar[int]
    extremum_kind: ExtremumKind
    point_idx: int
    time: int
    touch_id: int
    type: InteractionType
    z: float
    def __init__(self, touch_id: _Optional[int] = ..., point_idx: _Optional[int] = ..., z: _Optional[float] = ..., type: _Optional[_Union[InteractionType, str]] = ..., time: _Optional[int] = ..., extremum_kind: _Optional[_Union[ExtremumKind, str]] = ...) -> None: ...

class InteractionFrame(_message.Message):
    __slots__ = ["frame_id", "interactions", "timing"]
    FRAME_ID_FIELD_NUMBER: _ClassVar[int]
    INTERACTIONS_FIELD_NUMBER: _ClassVar[int]
    TIMING_FIELD_NUMBER: _ClassVar[int]
    frame_id: int
    interactions: _containers.RepeatedCompositeFieldContainer[Interaction]
    timing: TimingSample
    def __init__(self, frame_id: _Optional[int] = ..., interactions: _Optional[_Iterable[_Union[Interaction, _Mapping]]] = ..., timing: _Optional[_Union[TimingSample, _Mapping]] = ...) -> None: ...

class Point3d(_message.Message):
    __slots__ = ["i_x", "i_y", "is_filtered", "is_valid", "x", "y", "z"]
    IS_FILTERED_FIELD_NUMBER: _ClassVar[int]
    IS_VALID_FIELD_NUMBER: _ClassVar[int]
    I_X_FIELD_NUMBER: _ClassVar[int]
    I_Y_FIELD_NUMBER: _ClassVar[int]
    X_FIELD_NUMBER: _ClassVar[int]
    Y_FIELD_NUMBER: _ClassVar[int]
    Z_FIELD_NUMBER: _ClassVar[int]
    i_x: int
    i_y: int
    is_filtered: bool
    is_valid: bool
    x: float
    y: float
    z: float
    def __init__(self, x: _Optional[float] = ..., y: _Optional[float] = ..., z: _Optional[float] = ..., i_x: _Optional[int] = ..., i_y: _Optional[int] = ..., is_valid: bool = ..., is_filtered: bool = ...) -> None: ...

class PointCloud3d(_message.Message):
    __slots__ = ["points", "size_x", "size_y", "size_z"]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    SIZE_X_FIELD_NUMBER: _ClassVar[int]
    SIZE_Y_FIELD_NUMBER: _ClassVar[int]
    SIZE_Z_FIELD_NUMBER: _ClassVar[int]
    points: _containers.RepeatedCompositeFieldContainer[Point3d]
    size_x: int
    size_y: int
    size_z: int
    def __init__(self, size_x: _Optional[int] = ..., size_y: _Optional[int] = ..., size_z: _Optional[int] = ..., points: _Optional[_Iterable[_Union[Point3d, _Mapping]]] = ...) -> None: ...

class SaveRequest(_message.Message):
    __slots__ = ["filename", "points"]
    FILENAME_FIELD_NUMBER: _ClassVar[int]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    filename: str
    points: PointCloud3d
    def __init__(self, filename: _Optional[str] = ..., points: _Optional[_Union[PointCloud3d, _Mapping]] = ...) -> None: ...

class SaveResponse(_message.Message):
    __slots__ = ["file", "success"]
    FILE_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    file: str
    success: bool
    def __init__(self, success: bool = ..., file: _Optional[str] = ...) -> None: ...

class StateRequest(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...

class StateResponse(_message.Message):
    __slots__ = ["frame_id", "isReady", "protocol_version"]
    FRAME_ID_FIELD_NUMBER: _ClassVar[int]
    ISREADY_FIELD_NUMBER: _ClassVar[int]
    PROTOCOL_VERSION_FIELD_NUMBER: _ClassVar[int]
    frame_id: int
    isReady: bool
    protocol_version: int
    def __init__(self, isReady: bool = ..., frame_id: _Optional[int] = ..., protocol_version: _Optional[int] = ...) -> None: ...

class TimingAck(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...

class TimingRequest(_message.Message):
    __slots__ = ["after_sequence"]
    AFTER_SEQUENCE_FIELD_NUMBER: _ClassVar[int]
    after_sequence: int
    def __init__(self, after_sequence: _Optional[int] = ...) -> None: ...

class TimingResponse(_message.Message):
    __slots__ = ["latest_sequence", "oldest_sequence", "samples", "session_id"]
    LATEST_SEQUENCE_FIELD_NUMBER: _ClassVar[int]
    OLDEST_SEQUENCE_FIELD_NUMBER: _ClassVar[int]
    SAMPLES_FIELD_NUMBER: _ClassVar[int]
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    latest_sequence: int
    oldest_sequence: int
    samples: _containers.RepeatedCompositeFieldContainer[TimingSample]
    session_id: str
    def __init__(self, samples: _Optional[_Iterable[_Union[TimingSample, _Mapping]]] = ..., latest_sequence: _Optional[int] = ..., oldest_sequence: _Optional[int] = ..., session_id: _Optional[str] = ...) -> None: ...

class TimingSample(_message.Message):
    __slots__ = ["frame_id", "milliseconds", "recorded_at_unix_ms", "sequence"]
    class MillisecondsEntry(_message.Message):
        __slots__ = ["key", "value"]
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: float
        def __init__(self, key: _Optional[str] = ..., value: _Optional[float] = ...) -> None: ...
    FRAME_ID_FIELD_NUMBER: _ClassVar[int]
    MILLISECONDS_FIELD_NUMBER: _ClassVar[int]
    RECORDED_AT_UNIX_MS_FIELD_NUMBER: _ClassVar[int]
    SEQUENCE_FIELD_NUMBER: _ClassVar[int]
    frame_id: int
    milliseconds: _containers.ScalarMap[str, float]
    recorded_at_unix_ms: int
    sequence: int
    def __init__(self, sequence: _Optional[int] = ..., frame_id: _Optional[int] = ..., recorded_at_unix_ms: _Optional[int] = ..., milliseconds: _Optional[_Mapping[str, float]] = ...) -> None: ...

class InteractionType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []

class ExtremumKind(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
