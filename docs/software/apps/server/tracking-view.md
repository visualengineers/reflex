# Tracking Server: Tracking View

<!-- omit in toc -->
## Table of contents

1. [Overview](#overview)
2. [Camera Setup](#camera-setup)
3. [Depth Data Visualization](#depth-data-visualization)
4. [Recording depth data streams](#recording-depth-data-streams)
5. [Configuration](#configuration)

![Tracking View](/reflex/assets/img/server/tracking-view_overview.png)

## Overview

This usually serves as the start view when starting the application, as it is the starting point for enabling and configuring depth sensing capabilities of the Elastic Display.

This view contains the selection of the sensor used for depth sensing, different options for processing and filtering the depth image, and a 3d view visualizing the 3d points received from the camera.

__[⬆ back to top](#table-of-contents)__

## Camera Setup

![Camera Selection](/reflex/assets/img/server/tracking-view_camera.png)

In this part, the depth camera and resolution can be selected.

Depth sensing is toggled in the title bar of this widget (only enabled when a camera and valid configuration is selected).

`Autostart` determines whether the selected camera configuration should be started automatically when the application is started.

__[⬆ back to top](#table-of-contents)__

## Depth Data Visualization

![Point Cloud](/reflex/assets/img/server/tracking-view_point-cloud.png)

When enabled, the 3d positions of received depth data from the sensor is visualized:

* `Red Points`: depth values that are discarded, e.g. by configuration of `Borders` (see [Border Configuration](config-view.html#borders))
* `Blue Points`: depth values on the __zero plane__ of the Display or father away from the camera (usually by __Pulling__ the surface)
* `Green Points`: depth values closer to the camera than the __zero plane__ (usually __Push__ interactions)
* `Yellow spheres`: if [Interaction Processing](interaction-view.html) is enabled, 3d positions of __Interactions__ are displayed in the 3d view
* __Bounding Box__ of all received depth values (`green wireframe`)
* __Zero Plane__ visualized by `grey plane`
* __Mimimum depth distance from zero plane__ is visualized by `red planes`
* __Maximum depth distance from zero plane__ is visualized by `blue planes`

__[⬆ back to top](#table-of-contents)__

## Recording depth data streams

![Point Cloud](/reflex/assets/img/server/tracking-view_recording.png)

Recording can be started/stopped by pressing the button in the title bar.

Also, a list of existing recordings is displayed.

For replaying existing depth streams, a specific Replay camera can be selected in [Camera Configuration](#camera-setup)

__[⬆ back to top](#table-of-contents)__

## Configuration

The Tracking view also provides access to all settings related to depth sensing and reconstruction. More details on the description of the [Configuration View](config-view.html)

__[⬆ back to top](#table-of-contents)__
