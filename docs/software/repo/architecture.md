---

title: Architecture

---

# {{  page.title }}

## Overview

![ReFlex Architecture]({{ site.baseurl }}/assets/img/overview/software.png)

### ReFlex.Core - Library

.NET Library to handle

* **Calibration** for mapping sensor-coordinates (distance from sensor) to device space (projected pixel coordinates + depth)
* **Tracking** using selected Depth Sensor (communicating with sensor layer)
* Processing depth images (**Filtering**) and extracting Interactions (**Interactivity**)
* Broadcast through **Networking** component

### Clients

* Client applications consume events from server via websockets / tcp / TUIO
* Configuration of Server via TrackingServer UI or automated via REST API
* additional depth image streaming utilizing websockets

## Design Considerations

* Client-Server architecture: ability run tracking/processing (server) and visualization (client) on different hardware
* Sensor Layer: Common interface for depth sensing devices (hardware and software-emulated)
* Core Framework: [Processing Pipeline](pipeline.html) and common types, platform independent

## Extension Points

* gRPC - using micro services to extend functionality
* Common sensor interface - easy to add additional sensors
* Interaction Observer - option to implement custom Point cloud processing algorithm (cloud-based, utilizing machine-learning, ...)