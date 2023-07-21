# server

## arguments

The startup arguments should be looking like this `1920 1080 0 0`.

[0] - width

[1] - height

[2] - coordinate origin x

[3] - coordinate origin y

The coordinate origin is in the left upper corner.

## controls - general

`Esc` - terminate application

`F` or `ALT` + `ENTER` - toggle between fullscreen and window

`show/hide Debug` - Toggle Debug-Window.

`show/hide Calibration` - Toggle Calibration-Window.

`show/hide Interactiion Vis` - Toggle Interaction-Window.

`close` - terminate application

`enable/disable Autostart` - Enables/Disables the autostart, that will be start the whole tracking process automatically.

## controls - main

`D` - Toggle Debug-Window.

`C` - Toggle Calibration-Window.

`I` - Toggle Interaction-Window.

## controls - camera

`Supported Depth Cameras` - Sets the depth camera that will be used for capture the depth image.

`Toggle Switch` - Starts/Stopps the tracking process.

## controls - filter

`Left- to Rightbound` - Sets the left and right range of the processing from the middle of the depthimage.

`Lower- to Upperbound` - Sets the lower and upper range of the processing from the middle of the depthimage.

`Threshold` - The threshold is the maximal travel range of a measurement point within one frame.

`Boxblur Radius` - Sets the number of adjacent points that will be used to smooth the depthimage.

`Distance` - Sets the distance from the camera to the projection plane.

`Min to Max Distance` - Sets the minimum and maximum depth at which interactions are measured.

`Min Angle` - Sets the minimum angle between two vectors, that will be interpreted as an interaction.

`Min to Max Confidence` - Sets the minimum and maximum number of frames at which a interaction is valid.

`Input Distance` - Sets the minimum distance between two interactions.

`load` - Loads the settings.

`save` - Saves the settings.

`reset` - Resets the settings.

## controls - interaction

`Toggle Switch` - Starts/Stopps the interaction tracking process.

`Interval` - Sets the time for one tracking process in milliseconds.

## controls - server

`Toggle Switch` - Starts/Stopps the broadcast.

`Port` - Sets the port from which the server is broadcasting.

## controls - calibration

`S` - Start new calibration session.

`left mouse button` - Set calibration point.