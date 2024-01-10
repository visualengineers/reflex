---

title: "DepthTouch: Technical Specifications"

---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Projector](#projector)
2. [Depth Sensor](#depth-sensor)
3. [Fabric](#fabric)
4. [Dimensions](#dimensions)

## Projector

![Optoma GT 1070Xe]({{ site.baseurl }}/assets/img/hardware/optoma_gt1070xe.jpg)

**Optoma GT 1070Xe**

cf. [Product page](https://www.optoma.de/product/gt1070xe)

### relevant specs

| Type                        | Value       | Relevance for Tabletop                                                                                                                                                      |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolution                  | 1920 x 1080 | 1080p resolution for text legibility, higher is better                                                                                                                      |
| Brightness                  | 2800 lumens | especially in sun light, backprojection needs a bright light source                                                                                                         |
| Keystone - Vertical         | +/- 40°     | correcting distortions dur to sloped mounting of the projector                                                                                                              |
| Throw Ratio                 | 0.49 : 1    | lower is better - necessary to preserve usable height of the table                                                                                                          |
| Minimum Projection Distance | 0.5m        | also important for height of the table                                                                                                                                      |
| Native Offset               | 116%        | this means image is projected "above" the projector, which allows that the projector "looks outside" the table and therefore the height of the table can be reduced further |

The most important specs are *Throw Ratio*, *Minimum Projection Distance* and *Native Offset*, which in this combination allow the projection without utilizing mirrors to extend projection distance.

### remarks

* there are also Ultra-Short throw projectors available, which have an even better throw ratio and also offer a higher resolution. However, the issue is that these projectors have a very shallow range in which the projection is focused (often the projected image is not even completely in focus over the whole projection area but starts to soften in direction of the corners ). This is a severe issue when deforming the surface, as the deformed parts quickly move out of focus and content becomes blurry and unreadable.
* the mentioned projector is discontinued; and a newer model is available. Although we do not have practical experience with the model (yet),  the tech specs of the [Optoma GT2000HDR](https://www.optomaeurope.com/product/gt2000hdr) imply that it may be suitable for building the Elastic Display tabletop. Most of the relevant spec are equal or even better that the reference model.
* another alternative with similar specs, but featuring native 4k resolution is the [Optoma UHZ35ST](https://www.optomaeurope.com/product/uhz35st). The question is whether the 4K resolution make a noticeable difference, as the fabric has usually a visible structure which limits the visibility of fine details of the projection.

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

![Lycra Fabric]({{ site.baseurl }}/assets/img/hardware/fabric.jpg)

* Lycra fabric (8 - 20% Elastan)
* Density: 200 - 300g/qm
* white color

## Dimensions

![Dimensions of the tabletop]({{site.baseurl}}/assets/img/hardware/Tisch_1.png)

|                                                  |       |
| ------------------------------------------------ | ----- |
| Width of the metal frame                         | 1.16m |
| Height of the metal frame (without feet)         | 1.0m  |
| Depth of the metal frame                         | 0.68m |
| Width of the projected image                     | 1.1m  |
| height of the projected image                    | 0.62m |
| distance between projector front lens and fabric | 0.5m  |
| distance between depth sensor and fabric         | 0.4m  |

__[⬆ back to top](#table-of-contents)__
