# Tracking Server: Video Tutorials

<!-- omit in toc -->
## Table of contents

1. [Sensor Setup](#sensor-setup)
2. [Visualizing Sensor Data](#visualizing-sensor-data)
3. [Interaction Processing](#interaction-processing)
4. [Calibration](#calibration)
5. [Interaction Broadcasting](#interaction-broadcasting)
6. [Recording Sensor Data](#recording-sensor-data)

## Sensor Setup

* select camera and resolution
* deactivate box filter for initial setup
* compute zero plane
* align sensor to projective surface
* specify tracking borders
* set minimum distance to prevent depth value clamping
* filter points on the borders and outside the tracking area
* adjust minimal and maximum deformation
* setup confidence value to minimize flickering
* finetuning of box filter
* optional: interaction filtering settings

<video poster="{{ site.baseurl }}/assets/video/sensor-setup-title.jpg" controls>
  <source type="video/mp4" src="{{ site.baseurl }}/assets/video/sensor-setup.mp4">
</video>

## Visualizing Sensor Data

* fullscreen sensor data visualization
* visualization settings
* color coding values above and below the projection surface
* checking tracking distances

<video poster="{{ site.baseurl }}/assets/video/sensor-data-title.jpg" controls>
  <source type="video/mp4" src="{{ site.baseurl }}/assets/video/sensor-data.mp4">
</video>

## Interaction Processing

* select interaction processor
* check tracking accuracy in full screen visualization

<video poster="{{ site.baseurl }}/assets/video/process-interactions-title.jpg" controls>
  <source type="video/mp4" src="{{ site.baseurl }}/assets/video/process-interactions.mp4">
</video>

## Calibration

* specify projected screen area
* save area and activate interactions
* press and hold each of the yellow calibration points
* apply calibration and verify by displaying calibrated positions
* save calibration to settings

<video poster="{{ site.baseurl }}/assets/video/calibration-procedure-title.jpg" controls>
  <source type="video/mp4" src="{{ site.baseurl }}/assets/video/calibration-procedure.mp4">
</video>

## Interaction Broadcasting

* select network interface and broadcasting address
* specify settings for TUIO protocol

<video poster="{{ site.baseurl }}/assets/video/broadcast-interactions-title.jpg" controls>
  <source type="video/mp4" src="{{ site.baseurl }}/assets/video/broadcast-interactions.mp4">
</video>

## Recording Sensor Data

* specify name and start recording current camera
* recording
* select ReplayCamera and desired recording
* replay depth sensor stream

<video poster="{{ site.baseurl }}/assets/video/record-replay-title.jpg" controls>
  <source type="video/mp4" src="{{ site.baseurl }}/assets/video/record-replay.mp4">
</video>
