---
title: Requirements Analysis
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Deriving Requirements from Case Studies](#deriving-requirements-from-case-studies)
2. [Functional Contributions and Consolidation](#functional-contributions-and-consolidation)
3. [Development Tools and Research Support](#development-tools-and-research-support)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [From Requirements to Architecture](#from-requirements-to-architecture)

## Deriving Requirements from Case Studies

The ReFlex framework evolved through the conception, implementation, and demonstration of [Elastic Display case studies]({{ site.baseurl }}/knowledge/case-studies/overview.html). Each application exposed requirements that existing tools did not yet meet. The tools were extended for that scenario, followed by a consolidation step: reusable functionality was integrated into the main framework, more specific mechanisms were generalized, and application-specific components remained outside the core.

This process distinguishes three kinds of contribution:

- **Functional requirements** define the capabilities needed to capture, process, configure, and communicate surface deformation.
- **Non-functional requirements** define the expected responsiveness, reliability, architectural flexibility, and sustainability of the software.
- **Development tools** support prototyping, testing, integration, and the creation of new applications.

The following figure traces these contributions across the case studies and subsequent research projects. It records the origin of requirements and consolidation decisions rather than the complete feature set of each prototype.

![Requirements derived from the case studies, showing integrated and excluded functionality, non-functional requirements, and developer tools]({{ site.baseurl }}/assets/img/overview/requirement_analysis.png){:.full-width-scheme .transparent-background}

**Figure 7-2:** Requirements derived from experience with the case studies. Blue entries indicate functionality integrated into the framework; grey entries indicate concepts excluded from the core; green entries represent non-functional requirements; orange entries identify development tools.

The figure's label *rejected* concerns inclusion in the core framework. It does not mean that the corresponding concept was never implemented or was unsuitable for an application. Physics simulations, zoomable interfaces, gesture interpretation, and interactive lenses remained useful application components. The figure also groups developments around their motivating scenarios; some functions were integrated or generalized in later iterations.

**[⬆ back to top](#table-of-contents)**

## Functional Contributions and Consolidation

The progression began with direct use of surface-wide depth data, added discrete contact detection, and eventually separated tracking from visualization through a distributed architecture. The resulting framework needed to expose both continuous surface representations and individual [interactions]({{ site.baseurl }}/software/repo/interactions.html), with configuration and communication independent of a particular application technology.

| Case study | Functional contribution or requirement | Consolidation and application boundary |
| ---------- | -------------------------------------- | -------------------------------------- |
| [DepthTouch]({{ site.baseurl }}/knowledge/case-studies/depthtouch.html) | Calculate a vector field from surface deformation and map sensor coordinates to screen coordinates using three-point calibration. | Both functions were taken up in later framework iterations. The physics simulation remained an application-specific component; the transition to FlexiWall did not directly reuse every DepthTouch feature. |
| [FlexiWall]({{ site.baseurl }}/knowledge/case-studies/flexiwall.html) | Provide access to the depth image, transform its pixel coordinates between sensor and projection spaces, and map depth values to the relevant interaction range. | Depth-image access and mapping became reusable functions. Pixel-based layer blending and loading layered datasets remained application responsibilities. |
| [DEEP]({{ site.baseurl }}/knowledge/case-studies/deep.html) | Process the depth-derived point cloud to detect multiple contacts. Generalize surface configuration with an explicit resting plane and minimum-deformation thresholds. Abstract the sensor layer to support Kinect generations 1 and 2. | Detection initially supplied multiple points without persistent identities across frames. Physics simulation and zoomable-interface techniques remained external components. Extended calibration was not retained in the main framework because its limited benefit did not justify the calibration effort. |
| [Interactive Animations]({{ site.baseurl }}/knowledge/case-studies/interactive-animations.html) | Generalize single-touch detection, add image-based calibration and Intel RealSense support, and automatically initialize the sensor and application configuration at startup. | Exhibition use made stable, unattended operation important. Animation control and navigation gestures stayed in the application layer. |
| [Zoomable Product Browser]({{ site.baseurl }}/knowledge/case-studies/zoomable-product-browser.html) | Establish the relevance of persistent touch identifiers and multi-touch input for collaboration and complex gestures. | The prototype itself used single-touch detection. Its application context motivated contact continuity as a broader requirement; gesture recognition was not developed as a general core-framework component. |
| [Glyphboard]({{ site.baseurl }}/knowledge/case-studies/glyphboard.html) | Define a shared interaction-data format and communicate interactions through WebSockets so an existing web application can use an optional Elastic Display input layer. | Tracking and analysis were fully decoupled from visualization and scenario-specific logic. Gesture interpretation remained client-side; the distributed setup introduced communication-latency requirements. |
| [DeepZoom]({{ site.baseurl }}/knowledge/case-studies/deep-zoom.html) | Optimize depth-image analysis and expose parameters for point-cloud creation and filtering. | Configurable processing supported a separately implemented visualization client. Image loading, magnification, and lens presentation remained client responsibilities. |
| [DisPlay]({{ site.baseurl }}/knowledge/case-studies/display.html) | Provide a tracking-configuration UI, persist startup settings, and configure viewport boundaries for correct coordinate mapping when a client uses only part of the projection. Extend automatic startup to a client-server setup, including client-driven parameterization. | The case study consolidated a dedicated client-server architecture. The earlier monolithic autostart mechanism from Interactive Animations needed to accommodate separate programs and configuration across their boundaries. |
| [Construction Progress Visualization]({{ site.baseurl }}/knowledge/case-studies/bim.html) | Exercise and optimize existing functionality and the overall architecture, particularly stability and extensibility. | No new core-framework functions were introduced. The foot switch, gestures, and combination of layer navigation with zoom were implemented as application-specific concepts. |
| [Layers]({{ site.baseurl }}/knowledge/case-studies/layers.html) | Add Azure Kinect support, web-based configuration, REST-based configuration and pipeline control, and simultaneous delivery of interaction data and streamed depth images. | The core retained .NET for compatibility with the sensor layer. WebSockets delivered interactions; SignalR handled larger surface-data streams, including point clouds and vector fields. Interactive lenses remained a client-side feature. |
| [Further studies, prototypes, and student projects]({{ site.baseurl }}/knowledge/case-studies/other-prototypes.html#implications-for-framework-development) | Motivate interfaces with other frameworks, interaction logging, and surface measurements, alongside more accessible development and integration workflows. | These contributions arose across several projects. Integration mechanisms could be reused while scenario-specific control of external actuators, such as TactJam vibration motors, remained outside the core. |

The green entries in Figure 7-2 trace the associated quality requirements. DEEP made efficient contact detection and flexible reuse across application contexts explicit. Interactive Animations emphasized stability in exhibitions, while Glyphboard introduced the need for low-latency communication between decoupled components. DisPlay consolidated the distributed architecture, Construction Progress Visualization exercised its extensibility, and Layers added streaming-bandwidth requirements. Further studies and student projects broadened the focus to portability, maintainability, repository structure, and reproducibility.

The main architectural consequence was a clear division of responsibilities: the framework captures and processes deformation and exposes the resulting data and configuration interfaces; applications decide how these inputs affect content, simulated forces, gestures, and interface state. Persistent identifiers support gestures that require the history of individual contacts, without making identity tracking a prerequisite for every single-touch or threshold-based action.

Figure 7-2 also includes **external processing through gRPC** as an extensibility mechanism of the evolving framework. A Python service for extracting extrema from a point cloud demonstrated this integration. This framework extension is distinct from the Layers client's interaction concept: it provides an integration boundary for external analysis implementations.

**[⬆ back to top](#table-of-contents)**

## Development Tools and Research Support

The tools evolved alongside the input representations and architecture. A synthetic depth image suited FlexiWall's shader-based rendering, but was insufficient for applications expecting extracted contact data. Later tools therefore simulated contacts or a point cloud and supported recording and playback.

| Context | Development support | Purpose |
| ------- | ------------------- | ------- |
| FlexiWall | Depth-image emulator | Develop and prepare layered content without requiring the physical installation. |
| DeepZoom | Touch-point simulator | Test application behaviour using synthetic interaction points independently of the tracking hardware. |
| DisPlay | Unreal Engine plugin | Integrate surface interactions with a game-engine client and support reuse across technologies. |
| Layers | Point-cloud emulator and recording/playback | Generate synthetic surface data or replay captured data for development, testing, and repeatable investigation. |
| Further studies and student projects | Application templates, Unity and other engine integrations, developer documentation, and reusable class, type, and component libraries | Reduce the effort needed to create clients, integrate external technologies, and contribute to shared tools. |

Feedback from these projects also established requirements for platform-independent development, a repository structure that supports collaboration, continuous integration with tests, and the preservation of study-specific builds. The [student-project experiences]({{ site.baseurl }}/knowledge/case-studies/other-prototypes.html#implications-for-framework-development) illustrate how missing templates, incomplete documentation, emulator limitations, and integration problems informed subsequent improvements.

**[⬆ back to top](#table-of-contents)**

## Non-Functional Requirements

The non-functional requirements fall into three groups: responsiveness and reliable use; architectural properties; and sustainable collaboration as an open-source research tool. Table 7-1 summarizes the requirements and the corresponding targets or measures. These entries express development goals and design measures, not measured results or a claim that every target has already been met.

| Group | Requirement | Target / measure |
| ----- | ----------- | ---------------- |
| Usability | Performance | Processing in **< 50 ms**, with a **30 ms target**; depth-image streaming with little additional impact on latency. |
| Usability | Availability | Failure-free operation for **at least 4 hours**. |
| Usability | Robustness | Stable memory usage. |
| Architecture | Decoupling UI and tracking | Distributed architecture. |
| Architecture | Configurability | Adaptation through suitable interfaces. |
| Architecture | Extensibility | Modular structure. |
| Architecture | Installability | Installers for tools and applications. |
| Open Source / Open Science | Portability | Use on common desktop operating systems. |
| Open Source / Open Science | Maintainability | Continuous-integration pipeline and tests. |
| Open Source / Open Science | Reusability | Reusable classes and components; application templates. |
| Open Source / Open Science | Suitable repository structure | Monorepository with integrated documentation. |
| Open Source / Open Science | Reproducibility | Specific releases and data repositories. |

**Table 7-1:** Overview of non-functional requirements, translated from the requirements analysis. The categories follow Ford & Richards (2021, pp. 58-60).

### Responsiveness and Streaming

The latency budget uses approximately **100 ms for the complete interaction-to-response path** as a design reference for direct manipulation. The source analysis contrasts this with the more permissive reference of approximately one second for navigation where users can see that an operation is being performed. For an Elastic Display's continuous deformation feedback, the stricter reference motivates the framework's processing target.

Three components contribute to the overall delay: sensor acquisition, framework processing and delivery, and application-side processing and presentation. The sensors considered in the analysis operate at up to **30 Hz**, corresponding to an interval of approximately **33 ms between frames**. The initial budget allocates approximately another 33 ms to the application, leaving roughly 33 ms for framework processing and delivery. From this, the preferred framework target is set to **30 ms**.

The analysis assumes that transfer from the physically connected sensor adds less than 10 ms and does not budget it separately. This is a simplifying assumption, and the frame interval should not be treated as a measurement of total sensor latency. The **< 50 ms processing limit** in Table 7-1 is a relaxed bound, motivated by the expectation that client processing is generally less complex than point-cloud analysis. Meeting this bound alone does not guarantee a 100 ms overall response: the sensor, transport, and client delays still need to fit within the remaining budget. Processing and delivery times must therefore be distinguished from the complete interaction-to-response time when validating the system.

Depth images and point clouds contain much more data than lists of interactions. Their streaming consequently adds a bandwidth requirement as well as a latency requirement. The objective is to keep delivery of surface data as close as possible to the latency of interaction events, including when both streams are active. Layers made this requirement explicit by consuming interaction data and depth images simultaneously. Request-based configuration through the REST API remains separate from continuous data delivery.

### Availability and Robustness

Exhibitions require the system to operate predictably for extended periods. The target of at least four hours without failure makes this expectation more concrete than a general demand for stability. Automatic initialization and restoration of configuration support installation setup, while reliable runtime behaviour is required throughout the session.

Stable memory usage is a prerequisite for such operation. Depth-image and point-cloud processing involve copying sensor values, and parallel pipeline steps can retain several representations at once. Avoiding memory leaks and uncontrolled accumulation of data is therefore important for both sustained performance and failure-free use. A successful short demonstration does not by itself establish that these longer-duration requirements are satisfied.

### Architecture and Configurability

The central architectural requirement is the **decoupling of tracking from the user interface**. Applications should be able to use the tools across different scenarios and client technologies without requiring scenario-specific changes to the tracking core. A distributed architecture provides the communication boundary needed for this separation.

Configurability allows applications and development tools to adapt sensor selection, processing, calibration, viewport mapping, and communication through defined interfaces. This also supports reproducible startup and the transition between scenarios without rebuilding the tracking implementation.

Extensibility requires a modular structure in which sensors, processing steps, and integration components can be added or exchanged. This follows the open-closed principle: extend functionality through suitable boundaries while limiting changes to established components. Installers complement these architectural measures by making tools and applications easier to deploy.

### Open Source and Open Science

Portability targets use of the framework and tools on **Windows, Linux, and macOS desktop systems**. The purpose is to support research and development in different environments. This remains a requirement for the software; compatibility of individual sensors and their SDKs must also be considered when choosing a setup.

Maintainability and collaborative integration depend on automated builds and tests, supported by the [continuous-integration pipeline]({{ site.baseurl }}/software/repo/ci.html). Reusable libraries, shared components, and application templates reduce duplicated work and help new applications adopt the same interfaces.

A monorepository with integrated documentation keeps the framework, related tools, and their usage information together. Clear structure and documentation support both reuse and contributions. For Open Science, reproducibility additionally requires identifying and preserving the software build associated with a study, together with the relevant data. Specific releases, archived builds, and data repositories make it possible to distinguish the version used for an experiment from later development.

**[⬆ back to top](#table-of-contents)**

## From Requirements to Architecture

These requirements provide the rationale for the [framework architecture]({{ site.baseurl }}/software/repo/architecture.html), its [processing pipeline]({{ site.baseurl }}/software/repo/pipeline.html), and the separation of sensor access, interaction extraction, communication, and client applications. Functional capability, development support, and non-functional quality need to be assessed together: additional processing or data representations are useful only when applications can integrate them and the system remains responsive and reliable.

**[⬆ back to top](#table-of-contents)**
