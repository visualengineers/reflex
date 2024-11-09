---
title: Elastic Display
---

# {{ page.title}}

Elastic Displays are [shape-changing interfaces]({{ site.baseurl }}/knowledge/terms/shape-changing-interface) that are only temporally deformable, more precisely, they automatically return into their initial flat state after the deformation. The display allows users to give input by force-touch (e.g. pinching, pushing, folding, and twisting the display), providing them with rich haptic feedback.

Most applications use rear-projection to display graphical content on the malleable surface, as it prevents users from covering the projection with their hand’s shadow while interacting. Nearly all feature the use of non-slippery, elastic fabric like for example latex, lycra and spandex. Detecting and tracking complex deformations and multi-touch on the deformable display are a remaining challenge. Recent prototypes often take advantage of the *Intel RealSense* or the *Microsoft Kinect* depth sensor to rapidly detect multi-touch input in three dimensions, offsetting the high cost and unreliability of other approaches like infrared camera-based tracking.

The large visualization and interaction space of elastic displays is appropriate for vast amounts of *Zoomable 2D*, *Volumetric 2.5D* and *Spatial 3D* data contained in modern information visualizations. Evaluation of existing elastic display applications revealed that interaction with the dimension of depth is especially suited to simulate physics of objects, retrace time-based changes or explore different levels of detail in the data. To make the content accessible *Kammer et al.* in [New Impressions in Interaction Design: A Task Taxonomy for Elastic Displays](https://doi.org/10.1515/icom-2018-0021) propose techniques such as image sequences, pixel-based blending, vector fields and single- or multi-touch 3D. They state that elastic displays can support users to discover relationships, understand structures, search items, manipulate data, make decisions and collaborate. Additionally, *Tangibles* or *Gravibles* could be used to safe current state by retaining the shape of the surface.

## Examples

The **DepthTouch** system was used to realize a product browser to search products by similarity and for interactive in-depth physics simulation. (see: [DepthTouch: An Elastic Surface for Tangible Computing](https://doi.org/10.1145/2254556.2254706))
<div class="media-wrapper"><iframe src="https://player.vimeo.com/video/37264194" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

The **FlexiWall** system introduces different applications: a map viewer shows different semantic layers on geographical maps, a painting explorer allows analyzing the painting process through different radiological scans made of an art piece, and a photo browser allows local application of different image effects. Moreover, big data clustering algorithms can be investigated using either layers or a semantic zoom.

![exploring big data landscapes on the FlexiWall]({{ site.baseurl }}/assets/img/kb/flexi-wall.jpg){:.responsive-media}
