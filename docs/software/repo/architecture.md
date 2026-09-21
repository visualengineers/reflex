---

title: Architecture

---

# {{  page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Overview](#overview)
2. [Design Considerations](#design-considerations)
3. [Extension Points](#extension-points)
4. [Technological Evolution of the ReFlex Framework](#technological-evolution-of-the-reflex-framework)

## Overview

![ReFlex Architecture]({{ site.baseurl }}/assets/img/overview/architecture_ReFlex.png)

The core functionalities of the ReFlex framework are implemented via a processing pipeline that is both high-performance and extensible. Client applications are integrated using an event-driven architectural style. To facilitate the streaming of sensor data, the pipeline is extended to include a dedicated communication layer, which encapsulates the use of various protocols. Calibration takes place in the sensor layer, as it can be applied not only to interaction data but to any streamed sensor values. The [emulator tool]({{ site.baseurl }}/software/apps/emulator.html) simulates a synthetic depth camera rather than simply transmitting simulated interaction values. In addition to the emulator, a recording component is available for reproducing interactions with the elastic surface for development, testing and validation.

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

__[⬆ back to top](#table-of-contents)__

## Design Considerations

* Client-Server architecture: ability run tracking/processing (server) and visualization (client) on different hardware
* Sensor Layer: Common interface for depth sensing devices (hardware and software-emulated)
* Core Framework: [Processing Pipeline](pipeline.html) and common types, platform independent

__[⬆ back to top](#table-of-contents)__

## Extension Points

* gRPC - using micro services to extend functionality
* Common sensor interface - easy to add additional sensors
* Interaction Observer - option to implement custom Point cloud processing algorithm (cloud-based, utilizing machine-learning, ...)

__[⬆ back to top](#table-of-contents)__

## Technological Evolution of the ReFlex Framework

The following section briefly outlines and contextualises the technological development of the ReFlex framework. The focus is on presenting the architectural approaches and explaining how various aspects have been incorporated into the next generation of the framework. This also includes distinguishing the FlexiWall and dSense iterations from the current ReFlex framework, as well as the technologically necessary changes between the different approaches, which necessitated a comprehensive restructuring.

### FlexiWall (2014)

The FlexiWall framework was designed as an experimental environment for layer-based content.

![FlexiWall Architecture]({{ site.baseurl }}/assets/img/overview/architecture_FlexiWall.png)

The first iteration of the FlexiWall prototype utilised a monolithic layered architecture. This approach was chosen for its simplicity and was also motivated by the focus on technological validation. The framework consisted of three layers: 

1. The sensor layer provided the connection to the depth camera; initially limited to the Microsoft Kinect 1, the Microsoft Kinect 2 was later also integrated as a sensor.
2. The data layer enabled the loading of various datasets and configurations.
3. The visualisation layer contained the various components of the user interface. In addition to the display of the datasets, this also included the emulator as a development tool.

The architecture was further developed with a view to greater modularisation. In addition to the integration of an additional data module for data retrieval and caching, simulation, UI components and event handling in particular were offloaded as standalone modules within the context of physics-based interaction. The processing of sensor data for the extraction of extrema was also implemented as a separate module. In the context of the original FlexiWall application, shaders and associated components were encapsulated in a standalone module.

__[⬆ back to top](#table-of-contents)__

### Concept: Plugin-Structure (2016)

From a software architecture perspective, the experience gained from the FlexiWall framework raised the question of how different application concepts could be implemented in the most flexible way possible using a modular system. To this end, a restructuring into a plug-in-based architecture based on the PRISM framework for .NET was tested.

![Plugin Architecture]({{ site.baseurl }}/assets/img/overview/architecture_plugin.png)

As an initial step, the sensor layer was converted into an abstraction layer for various sensors, and a separate processing layer was implemented for the extraction of multi-touch points.

The architectural concept also envisaged an interaction layer acting as an interpreter for depth image analysis, so that, in addition to the detection of touch points, predefined gestures and, in the future, the detection of tangibles would also be enabled. The plugin layer contains a collection of pre-built components that can be combined in any way depending on the application scenario. The data layer comprises pre-built methods for connecting to various data sources.

A component was designed and implemented as a plug-in to utilise elastic displays as a zoomable user interface. However, the architectural concept was subsequently discarded. The main reason for this was the lack of focus on a specific scenario. Consequently, a large proportion of the work would have been required to develop components with little relevance to the topic of Elastic Displays, or to generalise the developed modules to ensure maximum flexibility of use and configurability. As a result, there was a risk that, during development, more effort would be spent on maintaining the interface toolkit than on the actual further development and research into Elastic Displays.

__[⬆ back to top](#table-of-contents)__

### dSense (2020)

The subsequent adaptation of the architecture focused on the processing pipeline, beginning with the extension of the sensor abstraction layer to accommodate various sensors. Following the extraction of depth values, the sensor values are filtered, after which processing takes place to detect touch interactions. The core framework encapsulates the basic functionalities, interfaces and data types. The optimisation of this pipeline, with a focus on multi-touch interactions, meant that the use of pixel-based blending and vector field streaming was not initially supported directly by the framework.

The iteration of the framework establishes the fundamental two-part structure of the architecture, which is also applied in the ReFlex framework: the extraction, filtering and processing of sensor data for use with elastic displays is implemented in the form of a pipeline. The choice of this architecture is based on its low complexity and the ease with which individual pipeline steps can be extended and interchanged. Thanks to its monolithic structure, low complexity and the ability to parallelise pipeline steps, this structure is also beneficial in terms of achieving the highest possible processing performance.

![FlexiWall Architecture]({{ site.baseurl }}/assets/img/overview/architecture_dSense.png)

In addition, a distributed overall architecture was designed: the server component utilises the pipeline structure to process the sensor data. Communication with client applications follows an event-driven architectural approach through the broadcasting of interaction data.

The motivation for this structure lay in the asynchronous nature of the communication and the loose coupling of the application components, which can operate completely independently of the server component. This approach scales very well, meaning that multiple clients can be used without any problems; likewise, the use of multiple server components – for example, when using multiple sensors – is possible with minor adjustments in the form of an additional message broker intermediate layer.

Furthermore, an [emulator]({{ site.baseurl }}/software/apps/emulator.html) was reintegrated as a development tool, which generates synthetic events for the client application.

__[⬆ back to top](#table-of-contents)__
