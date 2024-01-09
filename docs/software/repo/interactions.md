---

title: Interactions Format

---

# {{ page.title }}

## Introduction

## Interaction Format Specification

| Property            | Type (.NET)                                       | Description                                                                                                                                                    |
| ------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TouchId             | int                                               | unique identifier to map position to finger, e.g. to detect gestures                                                                                           |
| Position            | ReFlex.Core.Common.Components.Point3              | Position in normalized coordinates, plus flags for filter / validity                                                                                           |
| Type                | ReFlex.Core.Common.Util.InteractionType           | 0: None, 1: Push, 2: Pull                                                                                                                                      |
| ExtremumDescription | ReFlex.Core.Common.Components.ExtremumDescription | Description of the type of the detected Extremum                                                                                                               |
| Confidence          | int                                               | longest period of frames which this touch has been observed without interruption. If a touchpoint gets lost, this is decremented each frame                    |
| Time                | long                                              | .NET Timestamp for the frame capture (number of 100-nanosecond intervals that have elapsed since 12:00:00 midnight, January 1, 0001 in the Gregorian calendar) |

## Point3 Specification

| Property                | Type (.NET) | Description                                                  |
| ----------------------- | ----------- | ------------------------------------------------------------ |
| X                       | float       | horizontal screen position (normalized) [ 0 .. 1 ]                  |
| Y                       | float       | vertical screen position (normalized) [ 0 .. 1 ]                  |
| Z                       | float       | depth value (normalized) [ -1 .. 1 ]                  |
| IsValid        | bool         | flag to determine whether this point represents a valid spatial position (true) or has been marked as invalid by being outside the tracking volume range        |
| IsFiltered | bool         | usually the inverted IsValid flag, but can be set additional is another filter removed this point from the valid points  |

## ExtremumDescription Specification

Especially relevant for Multi-Touch interaction. Describes characteristics of **local** extremum, whether it is a local minimum or maximum. As this is usually based on sampling nearby points, the number of points (absolute number of samples and relative percentage) that support this estimate is given (e.g. when sampling with 10 points, `NumFittingPoints` = 9 / `PercentageFittingPoints` = 0.9 means a pretty safe estimate whereas, `NumFittingPoints` = 6 / `PercentageFittingPoints` = 0.6 suggests only a vague estimation)
When `PercentageFittingPoints` is around 0.5 typically `ExtremumType.undefined` is returned.

The extremum is always described relative to the surface, that means, a maximum is surrounded by points that are closer to the surface / zero plane.  

| Property                | Type (.NET)                          | Description                                                  |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Type                    | ReFlex.Core.Common.Util.ExtremumType | 0: Minimum, 1: Maximum, 2: Undefined                         |
| NumFittingPoints        | int                                  | absolute number of samples that fit into estimation          |
| PercentageFittingPoints | int                                  | relative number of samples that fit into estimation [0 .. 1] |

## Normalized coordinates

The lateral position values X,Y are mapped to the numeric interval [0, 1]. X = 0 and Y = 0 represents the upper left corner of the projection screen, X = 1 and Y = 1 the lower right corner of the screen.

For the Z coordinate, 0 represents the zero plane, respectively the distance of the fabric from the sensor without deformation. Negative Z values are closer to the sensor than the zero plane (push into the surface), positive values are farther away (pull the surface towards the user)

## Message Format (JSON)

``` JSON
[
    {
      "TouchId":0,
      "Position": {
        "X":0.3944792,
        "Y":0.38191035,
        "Z":-0.20515493,
        "IsValid":true,
        "IsFiltered":false
      },
      "Type":0,
      "ExtremumDescription":{
        "Type":0,
        "NumFittingPoints":10,
        "PercentageFittingPoints":1
      },
      "Confidence":30,
      "Time":638404355384290300
    }
]

```

## Conversion between .NET timestamp and TypeScript/JavaScript DateTime 

``` TypeScript

    public getTime(ticks: number): string {
        // ticks are in nanotime; convert to microtime
        const ticksToMicrotime = Math.floor(ticks / 10000);

        // ticks are recorded from 1/1/1; get microtime difference from 1/1/1 to 1/1/1970
        const epochMicrotimeDiff = 62135596800000;

        // new date is ticks, converted to microtime, minus difference from epoch microtime
        const tickDate = ticksToMicrotime - epochMicrotimeDiff;

        const resultDate = new Date(tickDate);

        return this._datePipe.transform(resultDate.getTime(), 'HH:mm:ss.SSS') as string;
    }

```
