---
title: "Case Study: DepthTouch"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Research Questions](#research-questions)
2. [Features and Limitations](#features-and-limitations)
3. [Scenario](#scenario)
4. [Findings and Discussion](#findings-and-discussion)

![DepthTouch: Title Image]({{ site.baseurl }}/assets/img/kb/case-studies/depth-touch_title.png){:.content__title-image}

| Profile field | Description |
| ------------- | ----------- |
| Title | DepthTouch |
| Year | 2012 |
| Focus | Concept, Implementation |
| Format | Elastic Display tabletop |
| Framework | - |
| Sensor | Microsoft Kinect |
| Architecture | Processing, OpenNI |
| Scenario | Playful exploration of physical interaction metaphors for manipulating groups of virtual objects |
| Features | - physics-based interaction through surface deformation<br> - gathering and separating virtual objects<br> - simultaneous interaction without individual finger tracking |
| Publication | *Peschke, J., Göbel, F., Gründer, T., Keck, M., Kammer, D. & Groh, R.* (2012): **DepthTouch: An Elastic Surface for Tangible Computing**. AVI '12, pp. 770–771. DOI: [10.1145/2254556.2254706](https://doi.org/10.1145/2254556.2254706).<br><br>*Peschke, J., Göbel, F. & Groh, R.* (2012): **DepthTouch: Elastische Membran zwischen virtuellem und realem Raum**. Mensch & Computer 2012 – Workshopband, pp. 493–496. |

DepthTouch was developed at the Chair of Media Design at Technische Universität Dresden and forms the starting point for the subsequent Elastic Display case studies.

## Research Questions

DepthTouch explored how the behaviour of natural materials could inform interaction with digital content. Its concept grew from experiments with thread, nets, and fabric: a thread suggested interaction with one-dimensional data, while nets and fabric membranes offered a basis for spatial interaction.

The central question was how deforming a physical surface could support the manipulation of virtual object groups. Pressing into fabric creates a depression in which objects can gather; lifting it creates a raised region that separates them. The prototype investigated how these familiar physical behaviours could become interaction metaphors, combining projected content with the tactile experience of deforming an elastic surface.

**[⬆ back to top](#table-of-contents)**

## Features and Limitations

### Physical Construction and Calibration

The tabletop used commercially available translucent Lycra stretched into an elastic surface. Lycra was selected for its elasticity, durability, affordability, ready availability, and suitability for rear projection. The fabric contained no sensors: a Microsoft Kinect depth camera captured its deformation, while a projector and mirror projected content onto it from below.

![DepthTouch CXonstruction]({{ site.baseurl }}/assets/img/kb/case-studies/depth-touch_construction.png)

Calibration aligned the coordinate systems of the depth camera and projector. Three points defining two linearly independent vectors were mapped to adjust scaling, translation, and rotation within the surface plane. This procedure corrected alignment within that plane, so the camera still had to be oriented perpendicular to the fabric and the projector's image plane parallel to it.

The [DepthTouch hardware documentation](../../hardware/depthtouch-overview.md) describes the tabletop construction and its later refinements.

### From Deformation to Simulated Motion

The implementation used Processing and OpenNI, with the Processing library fisica providing the physics simulation. Differences between neighbouring spatial points in the depth image produced a vector field that drove the movement of virtual spheres. The resulting motion made the spheres respond to the shape of the deformed surface.

The software did not reconstruct individual finger positions. Consequently, interaction was not limited by a fixed number of tracked contacts: simultaneous deformations could contribute to the simulation. However, the system could not identify the actions that produced those deformations. Application logic could respond to their results, such as spheres gathering at a location, rather than to explicitly recognized user actions.

**[⬆ back to top](#table-of-contents)**

## Scenario

DepthTouch provided a playful environment for manipulating groups of virtual spheres projected onto the fabric. Users changed the shape of the surface to influence the spheres through the simulated physical behaviour:

- **Gathering:** Pressing into the fabric created a depression, causing spheres to collect at its lowest point.
- **Separating:** Pulling the fabric upward created a raised region that dispersed spheres away from it.

The physical surface served as both the input medium and a source of haptic feedback. Users could feel the fabric while observing the virtual objects respond to its deformation. The scenario therefore connected the manipulation of real material with the behaviour of digital content through familiar physical patterns.

**[⬆ back to top](#table-of-contents)**

## Findings and Discussion

The source account reports that users consistently highlighted the playful, exploratory character of the interaction and the fabric's natural invitation to deform it. They also emphasized that familiar physical behaviour made the interaction intuitively understandable, relating the concept to reality-based interaction.

The prototype exposed a distinction relevant to subsequent framework development: capturing surface deformation can support simultaneous interaction without identifying individual contacts, but it does not by itself reveal which actions users perform. DepthTouch demonstrated the opportunities of this approach for physical simulation while making its limits for interpreting user input apparent.

These observations raised the broader question of how an elastic surface could extend conventional multi-touch systems with an additional interaction dimension. DepthTouch established the conceptual and technical starting point for the later case studies, including [FlexiWall](flexiwall.md), which explored further uses of surface deformation.

**[⬆ back to top](#table-of-contents)**
