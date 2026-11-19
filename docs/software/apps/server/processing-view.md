# TrackingServer: Processing View

<!-- omit in toc -->
## Table-of-contents

1. [Overview](#overview)
2. [Processing Options](#processing-options)
3. [Displaying Interactions](#displaying-interactions)
4. [Interaction History](#interaction-history)
5. [Motion Prediction](#motion-prediction)

## Overview

__[⬆ back to top](#table-of-contents)__

## Processing Options

![Processing Configuration](/reflex/assets/img/server/processing-view_processing.png)

__[⬆ back to top](#table-of-contents)__

## Displaying Interactions

![Interactions View](/reflex/assets/img/server/processing-view_interactions.png)

__[⬆ back to top](#table-of-contents)__

## Interaction History

![List of last Interaction Frames](/reflex/assets/img/server/processing-view_interaction-frames.png)

![List of Frames for each interaction](/reflex/assets/img/server/processing-view_interaction-history.png)

__[⬆ back to top](#table-of-contents)__

## Motion Prediction

The **Motion prediction** panel controls both display layers and the motion model. **Show prediction**, **Matching target**, **Linear forecast** and **Acceleration forecast** change local visibility. **Use prediction for contact assignment**, the sample count, acceleration settings and forecast horizon take effect through **Apply and save prediction**.

The forecast horizon is displayed in milliseconds (`0`–`1000` ms) and stored in seconds. It controls diagnostic forecasts, while contact assignment predicts to the actual observation timestamp. The requested sample count is limited by tracking-history capacity. Acceleration fitting requires at least three real measurements; missing detections do not add samples.

The overlay displays calibrated positions: measured points, smoothed squares, matching diamonds, linear forecasts and dashed acceleration forecasts. Trajectories retain up to 20 measured positions. Lost contacts retain their last measurement, while diagnostics forecast from it; suppressed contacts remain visible in diagnostics with their publication reason.

The **Forecast values** table uses uncalibrated sensor X/Y coordinates, pixels/s for velocity and pixels/s² for acceleration. Its timestamps are monotonic seconds, not wall-clock dates. It includes the sample count, measurement age, confidence and publication status. Enabling processing and prediction is required for motion data; hiding prediction also stops the diagnostic subscription.

See the [configuration reference]({{ site.baseurl }}/software/repo/config-file.html#contact-assignment-and-prediction) for defaults and the [REST API]({{ site.baseurl }}/software/apps/server/rest-api.html#settings) for saving settings from a client.

__[⬆ back to top](#table-of-contents)__
