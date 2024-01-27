# Tracking Server: Configuration View

<!-- omit in toc -->
## Table of contents

1. [Overview](#overview)
2. [Borders](#borders)
3. [Distance](#distance)
4. [Confidence](#confidence)
5. [Filter](#filter)
6. [Extremum Classification](#extremum-classification)
7. [Additional Settings](#additional-settings)
8. [Performance Visualization](#performance-visualization)

## Overview

This section contains the configuration for the filtering depth data and basic calibration of the whole system as wel as settings for extremum classification and smoothing. Furthermore, performance data for the different pipeline stages are available.

Settings are stored in `TrackingSettings.json` in `Config` directory of the application (Directory `Resources/bin/wwwRoot/` in installed application or `wwwRoot/Config` in Project __ReFlex.TrackingServer__)

__[⬆ back to top](#table-of-contents)__

## Borders

Settings that determine which parts of the point cloud are invalidated before filtering and processing steps. Most prominently used to trim point cloud in horizontal and vertical direction to eliminate areas that do not belong ro the interactive surface (e.g. parts of the frame)

![Configuration for Borders](/reflex/assets/img/server/config-view_borders.png)

| Setting | Value Range          | Description                                                                                                                                                                       | Unit |
| ------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Left    | [0, Right Border]    | Specify how many depth points on the left side are ignored. Maximum value corresponds with the border filter value on the right side. *Live Preview*: red dots are filtered points. | Pixel (in the depth image) |
| Right   | [Left Border, Frame Width] | Specify how many depth points on the right side are ignored. Minimum value corresponds with the border filter value on the left side. *Live Preview*: red dots are filtered points. | Pixel (in the depth image) |
| Top     | [0, Bottom Border]   | Specify how many depth points on the upper side are ignored. Maximum value corresponds with the border filter value on the lower side. *Live Preview*: red dots are filtered points. | Pixel (in the depth image) |
| Bottom   | [Top Border, Frame Height]        | Specify how many depth points on the lower side are ignored. Minimum value corresponds with the border filter value on the upper side. *Live Preview*: red dots are filtered points. | Pixel (in the depth image) |
| Min Distance   | [0, 1.44] | Filter out points that are too close to the sensor (usually "dead points" or points outside the tracking frustum) | meters (from the sensor) |
| Threshold  | [0, 0.1] | Specify maximum distance from zero plane for the points to be filtered | meters (from the zero plane) |
| Filter Type | - | Available limitation filters. *LimitationFilter*: filter based on the defined borders *AdvancedLimitationFilter*: filter based on the depth mask (additional to the borders) | - |
| Samples  | [0, 20] | Specify how many samples from the depth image are captured for initializing the filter. | number |

__REMARKS:__

* *Top*, *Bottom*, *Left*, *Right* refer to the camera coordinate system and are not affected by Calibration. This means that these values may be mirrored in regard to the users perspective
* Before `Initialize Filter`, it is recommended to deactivate `Box Filter` in [Additional Settings](#additional-settings)

__[⬆ back to top](#table-of-contents)__

## Distance

Basic configuration of the system: distance between sensor and fabric (zero plane), interaction space (maximum and minimum amplitude of deformation) and minimum distance between two touch points can be specified.

Zero plane can be computed automatically, which is done by measuring the mean distance of valid points (fabric must not be deformed for a precise measurement).

![Configuration for Borders](/reflex/assets/img/server/config-view_distance.png)

| Setting | Value Range | Description | Unit |
| --- | --- | --- | --- |
| Minimal Depth | [0, 0.3] | Specifies the minimal depth amplitude for both __Push__ and __Pull__ relative to the *Zero Plane*. Depth values smaller than this threshold are ignored for interaction processing. *Live Preview*: red planes. | meters (from the zero plane) |
| Maximum Depth | [0, 1] | Specifies the maximum depth amplitude for both __Push__ and __Pull__ relative to the *Zero Plane*. Depth values larger than this threshold are ignored for interaction processing. *Live Preview*: blue planes. | meters (from the zero plane) |
| Zero Plane | [0,3] | Specifies distance of the elastic surface from the depth sensor. Used to distinguish __Push__ and __Pull__ and to compute depth values for interactions. *Live Preview*: grey plane. | meters (from the sensor) |
| Between Extrema | [0, 250] | Threshold for __lateral distance__ between two extremums in the depth image (*pixel distance*). Used to filter redundant interactions which may occur due to noise. | pixel between x,y coordinates of extrema |

__[⬆ back to top](#table-of-contents)__

## Confidence

Confidence describes to which extent an interaction is based on a measurement error (e.g. jitter) or can be categorized as stable touch detection. To compute the value, on each frame, the associated touch point is recognized, the confidence value is increased (to a maximum value specified by `Maximum`). When an interaction is not recognized anymore, the confidence value is decreased for every frame the interaction is not detected (until the confidence value is 0).
This prevents flickering in case a touch point is not recognized anymore by some frames, but also introduces a certain lag, as the interaction is still "valid" when not touching the display, until the confidence value falls below the `Minimal` value. The lag also occurs if the `Minimal` value is rather high, as the interaction needs to be detected for the number of consecutive frames, before the interaction is marked as valid.

![Configuration for Distances](/reflex/assets/img/server/config-view_confidence.png)

| Setting | Value Range | Description | Unit |
| --- | --- | --- | --- |
| Minimal | [0, Maximum] | The minimal confidence for which the interaction is categorized as valid measurement | - |
| Maximum | [Minimum, 30] | The maximum confidence for an interaction. After reaching this value the confidence is not increased anymore | - |

__[⬆ back to top](#table-of-contents)__

## Filter

![Point Cloud Filter Settings](/reflex/assets/img/server/config-view_filter.png)

__[⬆ back to top](#table-of-contents)__

## Extremum Classification

![Configuration Classification of Extremums](/reflex/assets/img/server/config-view_extremums.png)

__[⬆ back to top](#table-of-contents)__

## Additional Settings

![Additional Settings](/reflex/assets/img/server/config-view_additional.png)

__[⬆ back to top](#table-of-contents)__

## Performance Visualization

![Performance Visualization for Tracking  Data](/reflex/assets/img/server/config-view_performance-tracking.png)

![Performance Visualization for Processing  Data](/reflex/assets/img/server/config-view_performance-processing.png)

__[⬆ back to top](#table-of-contents)__
