---
title: TUIO Interface
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Introduction](#introduction)
2. [Supported Formats](#supported-formats)
3. [Coordinates and Interaction Mapping](#coordinates-and-interaction-mapping)
4. [TUIO 2.0 Message Specification](#tuio-20-message-specification)
5. [TUIO 1.1 Message Specification](#tuio-11-message-specification)
6. [Message Example (TUIO 2.0)](#message-example-tuio-20)
7. [Configuration and Monitoring](#configuration-and-monitoring)

## Introduction

ReFlex supports TUIO as an alternative to the JSON [Interactions Format]({{ site.baseurl }}/software/repo/interactions.html). Detected multi-touch interactions are converted into OSC messages using CoreOSC and sent to a receiving application via UDP, TCP or WebSockets. Both TUIO 1.1 and TUIO 2.0 are supported.

__[⬆ back to top](#table-of-contents)__

## Supported Formats

Interactions can be encoded as 2D points with an additional pressure component or as 3D points. The interpretation is selected independently of the transport protocol.

| Interpretation | Configuration value | TUIO 1.1 address | TUIO 2.0 address | Depth representation |
| --- | --- | --- | --- | --- |
| 2D point with pressure | `TouchPoint2DwithPressure` (`0`) | `/tuio/25Dobj` | `/tuio2/ptr` | Signed depth in `[-1, 1]` |
| 3D point | `Point3D` (`1`) | `/tuio/3Dobj` | `/tuio2/p3d` | Depth mapped to `[0, 1]` |

__[⬆ back to top](#table-of-contents)__

## Coordinates and Interaction Mapping

The TUIO conversion copies `Interaction.Position.X` and `Interaction.Position.Y` without further normalization. Code 7-2 uses calibrated screen coordinates (for example, `292`, `117`); clients must therefore interpret these values in the coordinate system supplied by the processing/calibration pipeline rather than assume that they are always in `[0, 1]`.

| Interaction property | TUIO representation | Description |
| --- | --- | --- |
| `TouchId` | `c_id` (2.0), class ID `i` (1.1) | Identifies the tracked touch point. |
| `Position.X`, `Position.Y` | `x`, `y` | Lateral position, copied unchanged. |
| `Position.Z` with `TouchPoint2DwithPressure` | Pressure (2.0), `z` (1.1) | Signed normalized depth in `[-1, 1]`. Negative values represent pushing towards the sensor; positive values represent pulling towards the user. Zero is the undeformed surface. |
| `Position.Z` with `Point3D` | `z` | Converted using `(Position.Z + 1) / 2`. The undeformed surface is at `0.5`. |

`Confidence`, `Type`, `ExtremumDescription`, position validity/filter flags and the interaction's `Time` are not included in these messages. Frame metadata is generated separately.

ReFlex uses the configured `SessionId` for all points in a frame and for the alive message. Individual touches are distinguished by their touch/class IDs; the alive message does not enumerate individual touch IDs.

__[⬆ back to top](#table-of-contents)__

## TUIO 2.0 Message Specification

Each frame starts with `/tuio2/frm`, followed by one `/tuio2/ptr` or `/tuio2/p3d` message per interaction, and ends with `/tuio2/alv`.

### Frame (`/tuio2/frm`)

| Argument | Type (.NET / CoreOSC) | Description |
| --- | --- | --- |
| `frame_id` | `Int32` | Frame identifier for ordering updates. |
| `time` | `Timetag` | Constructed by ReFlex from `DateTime.Now.Ticks`: the number of 100-nanosecond intervals since January 1, 0001. This is an implementation-specific .NET tick value wrapped in an OSC timetag; it must not be interpreted as a conventional OSC/NTP timestamp. |
| `dimension` | `Int32` | Computed as `SensorWidth * SensorHeight`, e.g. `640 * 480 = 307200`. |
| `source` | `String` | Source description. The current implementation produces `ReFlex@{clientAddress} [{SensorDescription}]`. |

### 2D Point with Pressure (`/tuio2/ptr`)

Arguments are transmitted in the following order:

| Argument | Type (.NET) | Description |
| --- | --- | --- |
| `session_id` | `Int32` | Configured session ID. |
| `tu_id` | `Int32` | Constant `1`, used by ReFlex for the finger type. |
| `c_id` | `Int32` | Interaction `TouchId`. |
| `x` | `Single` | Horizontal position. |
| `y` | `Single` | Vertical position. |
| `angle` | `Single` | Constant `0`. |
| `shear` | `Single` | Constant `0`. |
| `radius` | `Single` | Constant `1`. |
| `pressure` | `Single` | Signed normalized depth in `[-1, 1]`. |

### 3D Point (`/tuio2/p3d`)

| Argument | Type (.NET) | Description |
| --- | --- | --- |
| `session_id` | `Int32` | Configured session ID. |
| `tu_id` | `Int32` | Constant `1`. |
| `c_id` | `Int32` | Interaction `TouchId`. |
| `x`, `y`, `z` | `Single` each | Position; `z` is mapped to `[0, 1]`. |
| `x_axis`, `y_axis`, `z_axis` | `Single` each | Constant direction `(0, 0, 1)`. |
| `radius` | `Single` | Constant `1`. |

### Alive (`/tuio2/alv`)

The final message contains one `Int32` argument: the configured `session_id`.

__[⬆ back to top](#table-of-contents)__

## TUIO 1.1 Message Specification

All messages in a frame use the selected profile address (`/tuio/25Dobj` or `/tuio/3Dobj`). The first argument is a string command:

| Order | Command | Remaining arguments | Description |
| --- | --- | --- | --- |
| 1 | `source` | `source` (`String`) | Source description, as in TUIO 2.0. |
| 2 | `alive` | `session_id` (`Int32`) | Configured session ID. |
| 3…n | `set` | See below | One message per interaction. |
| Last | `fseq` | `frame_id` (`Int32`) | Frame identifier. |

The `set` arguments are ordered as follows. `s` is the session ID and `i` is the touch ID (both `Int32`); all subsequent arguments are `Single` values.

{% highlight text linenos %}
/tuio/25Dobj set s i x y z a X Y Z A m r
/tuio/3Dobj  set s i x y z a b c X Y Z A B C m r
{% endhighlight %}

In the 2.5D profile, `z` carries signed depth; in the 3D profile, it carries remapped depth. ReFlex sets all angle (`a`, `b`, `c`), velocity (`X`, `Y`, `Z`), rotational velocity (`A`, `B`, `C`) and acceleration (`m`, `r`) values to `0`.

__[⬆ back to top](#table-of-contents)__

## Message Example (TUIO 2.0)

The following code example contains two points encoded as 2D points with pressure. The following is a readable representation of the OSC messages, with decimal points used for numeric values. The source string is preserved from the listing; the current implementation adds brackets around the sensor description.

{% highlight text linenos %}
[1] /tuio2/frm
    59671                       : Int32    (frame_id)
    638875034280336600           : Timetag  (time)
    307200                      : Int32    (dimension)
    ReFlex@::1 Azure Kinect     : String   (source)

[2] /tuio2/ptr
    33                          : Int32    (session_id)
    1                           : Int32    (tu_id)
    2                           : Int32    (c_id / TouchId)
    292                         : Single   (x)
    117                         : Single   (y)
    0                           : Single   (angle)
    0                           : Single   (shear)
    1                           : Single   (radius)
    -0.13418955                 : Single   (pressure)

[3] /tuio2/ptr
    33                          : Int32    (session_id)
    1                           : Int32    (tu_id)
    3                           : Int32    (c_id / TouchId)
    278                         : Single   (x)
    227                         : Single   (y)
    0                           : Single   (angle)
    0                           : Single   (shear)
    1                           : Single   (radius)
    -0.106472194                : Single   (pressure)

[4] /tuio2/alv
    33                          : Int32    (session_id)
{% endhighlight %}

The two touches have IDs `2` and `3`, share session `33`, and both represent pushes into the surface. Their positions are calibrated screen coordinates; the pressure values represent normalized deformation depth.

__[⬆ back to top](#table-of-contents)__

## Configuration and Monitoring

Configuration fields, saved example values, defaults and monitoring endpoints are documented under [TuioSettingValues in the configuration file]({{ site.baseurl }}/software/repo/config-file.html#tuiosettingvalues).

__[⬆ back to top](#table-of-contents)__
