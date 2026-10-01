---
title: "Case Study: Interactive Animations"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Research Questions](#research-questions)
2. [Features and Limitations](#features-and-limitations)
3. [Scenario](#scenario)
4. [Findings and Discussion](#findings-and-discussion)

![DepthTouch: Title Image]({{ site.baseurl }}/assets/img/kb/case-studies/interactive-animations_title.jpg){:.content__title-image}

| Profile field | Description |
| ------------- | ----------- |
| Title | Interactive Animations |
| Year | 2016 |
| Focus | Framework |
| Format | Elastic Display wall and tabletop |
| Framework | FlexiWall |
| Sensor | Intel RealSense |
| Architecture | Monolithic (.NET, WPF), with a plugin structure |
| Scenario | Interactive media station and art installation |
| Features | - exhibition context<br> - navigation concepts<br> - single-touch interaction |

The profile describes the historical FlexiWall iteration used for this case study, following the conventions in the [case study overview](overview.md#case-study-profiles).

## Research Questions

Interactive Animations investigated Elastic Displays as public interfaces for exhibitions, where playful interaction could make complex information accessible. It extended [FlexiWall's](flexiwall.md) layer-based approach to substantially longer image sequences. Deformation selected a frame across the entire display, allowing visitors to move through an animation like a flipbook.

The [initial application](https://www.youtube.com/watch?v=FzYNy2ca4fg) emerged from collaboration with the Chair of Scientific Computing and Applied Mathematics at Technische Universität Dresden. It used a precomputed scientific visualization of the interfaces between two immiscible liquids, based on an adapted numerical Cahn-Hilliard method.

The study addressed four main questions:

- How can the number of usable content layers be increased enough to support complex animations?
- Can single-touch detection provide the robustness and low latency needed for understandable feedback in a public installation?
- How can full-screen animation control develop into interaction with multiple information elements and structured content?
- How can simple gestures, previews, and direct feedback make the interaction understandable without instruction?

A central concern was encouraging visitors to touch and deform the surface in the first place. Earlier observations suggested that, once this barrier was overcome, users continued experimenting to understand the system's behaviour and limits.

**[⬆ back to top](#table-of-contents)**

## Features and Limitations

### Single-Touch Detection and Filtering

The prototype selected the **global extremum** of the depth image as its interaction point. Multiple independently detected contacts offered no benefit for controlling a single animation, while adding complexity and potential problems with latency and robustness. Following one point also simplified the limited gesture interpretation needed by the scenario.

Processing excluded predefined border regions, such as the frame or table structure, and restricted measurements to an admissible depth range. A confidence filter suppressed erroneous detections.

Initially, only deformation depth mattered; the lateral position did not affect full-screen animation control. When later iterations introduced selectable elements, two further measures stabilized position:

- **Movement restriction:** Limited lateral displacement between successive frames to help retain one interaction point when several pressure points were present.
- **Moving average:** Smoothed position changes, including jumps between extrema produced by different fingers.

These measures reduced instability but did not eliminate switching between fingers. The approach supported one selected interaction point, rather than independent control by multiple contacts.

### Animation Content and Runtime Flexibility

The implementation retained .NET and WPF while extending content handling beyond the earlier small set of image layers. It explored dynamic loading and caching of image sequences, predefined video sequences, and interactive control of WPF storyboards.

Storyboards offered detailed control over complex animations. In this implementation, however, they could not be loaded at runtime, so their content could not be changed after compilation. This exposed a tradeoff between expressive animation definitions and the ability to replace exhibition content without rebuilding the application.

### Calibration, Sensors, and Application Boundaries

Semi-automatic calibration detected a reference image displayed by the application and calculated a homography matrix. This improved alignment but did not remove the deformation-dependent drift that affected later hotspot interaction.

The framework added Intel RealSense support and consolidated it with the Kinect 2 SDK interface so that either sensor could be used. The historical profile identifies Intel RealSense as the sensor for this case study.

The separation between framework and application responsibilities also progressed. The core framework detected depth interactions in a dedicated processing step and informed the application of the current interactions. **Gesture recognition remained in the application layer.** A general framework gesture layer was deferred because the narrow scenario did not yet provide a sufficient basis for defining its broader requirements.

**[⬆ back to top](#table-of-contents)**

## Scenario

### Exploring a Fluid Simulation

The first iteration let visitors explore the temporal development of interfaces between water and a hydrophobic liquid. The precomputed sequence showed initially complex, interpenetrating structures becoming simpler as the interfacial area decreased during relaxation. Deformation controlled the displayed point in this sequence; it did not recalculate the fluid simulation.

The installation was presented alongside a large-format print in the 2016 Leibniz exhibition *Die beste der möglichen Welten. Was uns und die Welt verbindet.* It combined scientific visualization with an art-installation setting.

When no interaction was detected, a short preview played periodically. A stylized, gently pulsing hand suggested movement, while a circular preview behind it indicated the animation. This idle presentation invited visitors to try deforming the surface.

![Interactive Animations: Fluid Simulation]({{ site.baseurl }}/assets/img/kb/case-studies/interactive-animations_detail.png)

### Selecting and Controlling Hotspots

The next iteration replaced one full-screen visualization with several interactive widgets, potentially representing different exhibition topics. Pressing a widget revealed an animation, and further deformation controlled progress through its sequence.

![Interaction Concepts]({{ site.baseurl }}/assets/img/kb/case-studies/interactive-animations_interaction-concept.png){:.full-width-scheme .transparent-background}

The concept separated two components of interaction: **position selected the hotspot; depth controlled the animation**. Its development also explored how conventional button behaviour could use the additional depth dimension:

| Interaction concept | Role of deformation |
| ------------------- | ------------------- |
| Direct activation | An interaction within the element's surface region triggers an event. |
| Preview and activation | Shallow deformation provides feed-forward, such as a hover effect; crossing a depth threshold activates the action. |
| Continuous control | Deformation continuously adjusts an effect or the displayed animation frame. |

Distinguishing press and release phases was considered as a further refinement of discrete activation. These alternatives framed depth interaction as a continuous gesture that could either control a parameter or be interpreted as stages of an action.

The hotspot prototype displayed four circular elements. It provided access to multiple animations within one view, with release offering a straightforward return to the starting state. All elements remained peers at the same information level, limiting the representation of more complex relationships.

### Navigating between Hierarchy Levels

A subsequent prototype introduced two hierarchy levels. Its main menu divided the display into two halves. Pressing one half progressively expanded it across the other, eventually switching to the second level. That view contained four pulsing widgets whose animations were controlled through deformation.

**Pulling the surface outward returned to the main view.** This introduced an explicit navigation gesture alongside depth-controlled inspection, allowing the interface to present more information than would fit in a single set of hotspots.

**[⬆ back to top](#table-of-contents)**

## Findings and Discussion

### Robustness and Spatial Accuracy

The source reports implementation experience and observations during use, without a participant count or quantitative comparison. Its findings should therefore be understood as exploratory design insights.

Global-extremum detection was reported to support smoother, more accurate single-point interaction with simpler filtering than local-extrema detection. It reduced ambiguities from closely spaced contacts, such as those produced by pressing with an entire hand. Temporal smoothing nevertheless could not fully prevent jumps between fingers.

Projective distortion remained a significant limitation. As deformation increased, the detected position could drift out of the selected widget. This problem mattered much less for full-screen animation control than for interactions that depended on remaining within a particular surface region.

### Continuous Actions and Physical Interaction Space

The study favoured interpreting deformation as a continuous gesture, particularly for actions with adjustable parameters. For discrete actions, it recommended staged interaction: preview under shallow deformation, followed by execution after a threshold is crossed.

Both approaches require sufficient physical depth to distinguish interaction phases and allow meaningful parameter adjustment. The membrane's deformability was uneven: the centre was easier to press and allowed greater displacement than the edges. Users consequently tended to interact near the centre.

The prototypes used **five or fewer interactive elements** to accommodate these constraints. Central placement also reduced projection-related drift and benefited from greater tracking accuracy. Less deformable peripheral areas could display animations or other content controlled by the central widgets, making use of space that was less suitable for input.

### Navigation and Discoverability

Limiting the number of simultaneously available widgets strengthened the need for navigation between information levels. Observations indicated that moving into a deeper hierarchy level was understandable and usable. The source does not establish the same conclusion for the outward-pull return gesture.

Adapting the concept to network structures remained a direction for further work. Such interfaces might use back navigation sparingly or provide a reset to the starting point. These possibilities were proposed extensions, rather than demonstrated capabilities of the two-level prototype.

### Implications for Framework Development

For the forthcoming [requirements analysis](../../software/repo/requirements.md), the study provides evidence for several areas:

- **Detection suited to the task:** Support simple, robust single-point interaction when multiple contacts do not benefit the application.
- **Configurable processing and alignment:** Account for confidence, positional stability, latency, and drift as deformation changes.
- **Separation of responsibilities:** Expose detected interactions independently of content rendering, while allowing applications to interpret gestures for their own scenarios.
- **Flexible content handling:** Support longer sequences and responsive animation control, with explicit consideration of runtime content replacement.
- **Interaction feedback and state:** Enable previews, continuous parameter control, staged activation, and navigation between application states.
- **Layout informed by the hardware:** Consider available deformation depth and spatial accuracy when placing controls and separating input regions from content presentation.

These implications connect the prototype's capabilities and limitations to later framework design. They provide evidence for deriving requirements, rather than claiming that a general gesture layer or all proposed navigation concepts were already implemented.

**[⬆ back to top](#table-of-contents)**
