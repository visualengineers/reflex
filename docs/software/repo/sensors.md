--- 

title: Supported Depth Sensors

---


# {{ page.title }}

## List of Sensors

| Sensor                    | Web Link                                                                                               | SDK                          | Tested Version | OS                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- | -------------- | ----------------- |
| Microsoft Azure Kinect DK | [Azure Kinect DK documentation](https://learn.microsoft.com/en-us/azure/kinect-dk/)                    | `Azure Kinect Sensor SDK`    | 1.4.1          | Windows (Linux ?) |
| Microsoft Kinect 2        | [Kinect for Windows](https://learn.microsoft.com/de-de/windows/apps/design/devices/kinect-for-windows) | `Kinect for Windows SKD 2.0` | 2.0.1410.19000 | Windows           |
| Intel RealSense R200       | [Intel RealSense R200](https://www.mouser.com/pdfdocs/intel_realsense_camera_r200.pdf) | `librealsense` |  | Windows          |
| Intel RealSense D435       | [Intel RealSense D435](https://www.intelrealsense.com/depth-camera-d435f/) | `Intel RealSense SDK 2.0` | 2.54.2 | Windows, Linux, OSX           |
| Intel RealSense L515      | [Intel RealSense L515](https://www.intelrealsense.com/lidar-camera-l515/) | `Intel RealSense SDK 2.0` | 2.50.0 | Windows, Linux, OSX           |

## Installation Notices

### Azure Kinect DK

Install `Azure Kinect Sensor SDK` and check camera connectivity with `Azure Kinect Viewer`
Camera must be connected when application starts, otherwise an error is thrown (and not used by another application, e.g. the Viewer app)

### Microsoft Kinect 2

Installing SDK and connecting sensor should be sufficient.

### Intel RealSense

Copy the following dlls from SDK into `external` directory:

* Intel.Realsense.dll
* libpxcclr.cs.dll
* libpxccpp2c.dll
* realsense2.dll

Build application afterwards, then sensor should be available.

## Troubleshooting

* in general, try to connect the camera with the original manufacturer cable to a fast USB3 port
* most cameras have issues if other devices are connected to the same USB-Controller