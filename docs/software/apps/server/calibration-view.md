
# TrackingServer: Calibration View

<!-- omit in toc -->
## Table-of-contents

1. [Overview](#overview)
2. [Calibration Values](#calibration-values)
3. [Calibration Panel](#calibration-panel)
4. [Calibration Procedure](#calibration-procedure)

## Overview

## Calibration Values

![Calibration Values](/reflex/assets/img/server/calibration-view.png)

__[⬆ back to top](#table-of-contents)__

## Calibration Panel

__[⬆ back to top](#table-of-contents)__

## Calibration Procedure

For calibration of viewport and mapping of depth camera coordinates start interactive Calibration

* Before Calibrating, activate interaction processing in [Processing View](processing-view.html)
* Press `Calibrate` to switch to Calibration mode
* If not already displayed in fullscreen, now hit F11 to enter fullscreen mode

![Calibration Procedure](/reflex/assets/img/server/calibration-view_procedure.png)

* Drag borders so the viewport fits to the projected area (__1__)
* Save border by Pressing `Save Area` (__2__)
* Turn on `Update` of interactions (__3__)
* Now select the point to calibrate (Point 1, Point 2 or Point 3) (__4__)
* Push into the surface - Usually, only one extremum is displayed, and auto-selected. (__5__)
* after a short period, the selected point is confirmed automatically and the application proceeds to the next point
* Otherwise, click `Set point` to map this depth value to the calibration point.* If more than one extremum is displayed, pause auto-update and select the extremum-value, you find most appropriate
* Repeat this procedure for all 3 Calibration Points. (__6__, __8__)
* After setting all 3 Points, click on `Apply` to compute the __Calibration Matrix__ (__9__)
* To validate you calibration, activate the `Calibrated` toggle. The displayed touch points should now be displayed in the correct positions (__10__).
* Sometimes, it might be necessary to press `Save Area` again after `Apply` for applying the calibration correctly (__2__)
* Click `Save` to save calibration in the application settings (__11__)

__[⬆ back to top](#table-of-contents)__
