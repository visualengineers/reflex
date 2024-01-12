---

title: "FlexiWall: Technical Specifications"

---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Projector](#projector)
2. [Depth Sensor](#depth-sensor)
3. [Fabric](#fabric)
4. [Dimensions](#dimensions)

## Projector

**Acer H7550ST**

cf. [Product page](https://www.optoma.de/product/gt1070xe)

### relevant specs

| Type                        | Value       | Relevance for Tabletop                                                                                                                                                      |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolution                  | 1920 x 1080 | 1080p resolution for text legibility, higher is better                                                                                                                      |
| Brightness                  | 3000 lumens | especially in sun light, backprojection needs a bright light source                                                                                                         |
| Keystone - Vertical         | +/- 30°     |                                                                                                               |
| Throw Ratio                 | 0,69 - 0,76:1    | lower is better - necessary to reduce the size of the whole installation table                                                                                                          |
| Minimum Projection Distance | 0.9m        | also important for size of the whole instalation                                                                                                                                      |

The space between elastic projection area an projector is large enough, therefore, *Throw Ratio* is less important than in the [Tabletop setup]({{ site.baseurl }}/hardware/depthtouch-specs). More important is the *Brightness*, as in our experience, the display wall is more often used in brighter environments (or the large installation cannot be shaded from sunlight as easy as the smaller tabletop). However, using a projector with a large throw ratio can minimize the size of the area behind the screen (The depth sensor's field of view usually is larger than the projection frustum).

__[⬆ back to top](#table-of-contents)__

## Depth Sensor

![Azure Kinect]({{ site.baseurl }}/assets/img/hardware/azure_kinect.jpg)

**Microsoft Azure Kinect**

cf. [Product page](https://www.microsoft.com/en-us/d/azure-kinect-dk/8pp5vxmd9nhq)

### relevant specs

| Type              | Value                         | Relevance for Tabletop                                                         |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| Resolution        | 640 × 576                     | 1080p resolution for text legibility, higher is better                         |
| FPS               | 30                            | necessary for acceptable tracking rates (> 50fps would be better)              |
| miniumum distance | 0.25m                         | the same as the projector: necessary to preserve usable height of the tabletop |
| Field of View     | 75° x 65° (up to 120° x 120°) | necessary to track the complete screen                                         |

### remarks

* The Azure Kinect also offers a resolution up to 1024 x 1024 pixels, however, this mode is only capable of 15 fps. The resulting lag is from our experience not worth the increased accuracy.
* the *Field of View* is a little bit misleading, as the shape of the depth image is not rectangular, but has a diamond shape (or circle in case of the wide field of view), which means that the area of the display which can be tracked needs to fit into the diagonal of the field of view
* see also: [Azure Kinect DK hardware specifications](https://learn.microsoft.com/en-us/azure/Kinect-dk/hardware-specification)

__[⬆ back to top](#table-of-contents)__

## Fabric

<div class="image-container">
  <div style="flex:calc(2000/1810);">
    <img src="{{ site.baseurl }}/assets/img/hardware/flexiwall_fabric.jpg" alt="FlexiWall - fabric"/>
  </div>
  <div style="flex:calc(2000/1355);">
    <img src="{{ site.baseurl }}/assets/img/hardware/flexiwall_fabric-2.jpg" alt="FlexiWall - fabric"/>
  </div>
</div>

* Lycra fabric (8 - 20% Elastan)
* Density: 200 - 300g/qm
* white color

The core issue with our setup is the size of the fabric, as most shops only offer panels of 1.5m width. As the projection area has a height of about 1.5m, the technical setup could be extended with additional horizontal cross braces on which the panel can attached.

__[⬆ back to top](#table-of-contents)__

## Dimensions

The following image shows the top down view for our installation. The interaction space in front of the wall should be relatively large as most interactions follow the single presenter - multiple spectators pattern: 1 person interacts with the screen presenting content and other persons standing next to the screen observing the presenter.

![FlexiWall - floor plan]({{ site.baseurl }}/assets/img/hardware/floor_plan.png)

|                                                  |                    |
| ------------------------------------------------ | ------------------ |
| Width of the metal frame                         | 2,6m               |
| Height of the metal frame                        | 2.5m               |
| width of the projected image                     | 2.52m              |
| height of the projected image                    | 1.42m              |
| distance between projector front lens and fabric | 1.5m               |
| distance between depth sensor and fabric         | 1.5m               |
| dimensions of the shelf (W x H X D)              | 0.5m x 2.6m x 0.4m |

__[⬆ back to top](#table-of-contents)__
