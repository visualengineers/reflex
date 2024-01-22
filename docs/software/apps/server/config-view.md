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

__[⬆ back to top](#table-of-contents)__

## Borders

![Configuration for Borders](/reflex/assets/img/server/config-view_borders.png)

Settings that determine which parts of the point cloud are invalidated before filtering and processing steps. Most prominently used to trim point cloud in horizontal and vertical direction to eliminate areas that do not belong ro the interactive surface (e.g. parts of the frame)

| Setting | Value Range          | Description                                                                                                                                                                       | Unit |
| ------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Left    | [0, Right Border]    | Specify how many depth points on the left side are ignored. Maximum value corresponds with the border filter value on the right side. Live Preview: red dots are filtered points. | Pixel (in the depth image) |
| Right   | [Left Border, Frame Width] | Specify how many depth points on the right side are ignored. Minimum value corresponds with the border filter value on the left side. Live Preview: red dots are filtered points. | Pixel (in the depth image) |
| Top     | [0, Bottom Border]   | Specify how many depth points on the upper side are ignored. Maximum value corresponds with the border filter value on the lower side. Live Preview: red dots are filtered points. | Pixel (in the depth image) |
| Bottom   | [Top Border, Frame Height]        | Specify how many depth points on the lower side are ignored. Minimum value corresponds with the border filter value on the upper side. Live Preview: red dots are filtered points. | Pixel (in the depth image) |
| Min Distance   | [0, 1.44] | Filter out points that are too close to the sensor (usually "dead points" or points outside the tracking frustum) | meters (from the sensor) |
| Threshold  | [0, 0.1] | Specify maximum distance from zero plane for the points to be filtered | meters (from the zero plane) |
| Filter Type | - | Available limitation filters. *LimitationFilter*: filter based on the defined borders *AdvancedLimitationFilter*: filter based on the depth mask (additional to the borders) | - |
| Samples  | [0, 20] | Specify how many samples from the depth image are captured for initializing the filter. | number |

__REMARKS:__ *Top*, *Bottom*, *Left*, *Right* refer to the camera coordinate system and are not affected by Calibration. This means that these values may be mirrored in regard to the users perspective

__[⬆ back to top](#table-of-contents)__

## Distance

![Configuration for Borders](/reflex/assets/img/server/config-view_distance.png)

__[⬆ back to top](#table-of-contents)__

## Confidence

![Configuration for Distances](/reflex/assets/img/server/config-view_confidence.png)

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
