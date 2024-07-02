---
title: "Models: Data Types"
---

# {{ page.title }}

<!-- omit in toc -->
## Table-of-contents

1. [Introduction](#introduction)
2. [Planar Data (2D)](#planar-data-2d)
3. [Volumetric Data (2.5D)](#volumetric-data-25d)
4. [Spatial Data (3D)](#spatial-data-3d)
5. [References](#references)

## Introduction

*Spindler et al.* investigated three dimensional data structures in their work with *PaperLenses* and distinguished between

* volumetric,
* layered,
* zoomable, and
* temporal

information space [8]. We concentrate on a simplified data-driven point of view and distinguish three fundamental data structures suitable for Elastic Displays:

* Planar Data (2D)
* Volumetric Data (2.5D)
* Spatial Data (3D)

![Different data types that can be used with Elastic Displays]({{ site.baseurl }}/assets/img/kb/scientific/data.png){:.full-width-scheme}

## Planar Data (2D)

The category contains two-dimensional data structures, which are variable in their level of detail or two-dimensional structures that are dynamically rearranged using different parameters. Typical use cases are graphs such as *ElaScreen*'s Graph Visualization [10] or zoomable data like *FlexiWall*’s Data Exploration [3] or *Depth Touch*’s Product Browser [5].

## Volumetric Data (2.5D)

With this category we refer to 2D images (slices) that come in different variations so that they can be stacked or layered, forming a semantic space regarding a specific domain, usually time or semantic layers. A concrete use case in the time domain is the haptic exploration of paintings, revealing the evolutionary history of the painting process (cp. [6]).
Hence, different stages of work and drafts can be explored and compared. Similarly, *ElaScreen*'s Time Domain application [10] is used to display the development of graph data over time using specific parameters. Moreover, the movie viewer using the *Khronos Projector* helps to understand structures in movies concerning temporal and spatial changes between scenes [1]. An example for semantic
layers is the *FlexiWall* Map Viewer [6], which is used to explore political or historical maps including satellite or traffic data. In the *FlexiWall* Image Effects application [6], each slice contains a different manifestation of an image effect such as position of the focal plane, exposure, or recording technique (e. g. macro, infra-red, or xray). The Big Data Exploration approaches presented with *FlexiWall* [3] use different results of cluster algorithms for the layered images.
To our understanding, this also includes content in form of slices of three-dimensional structures, e. g. MRT, CT, or range images. We discarded the distinction between “real” volumetric data and layered data as both types use the same structural foundation, differing only regarding the density of data layers used and the continuity of values throughout the data volume. Natural zooming by using the depth interaction is an intuitive interaction with volumetric data. *ElaScreen*'s 3D scene navigation [10] is an example for this type of volumetric data.

The opportunities and limitations of layer-based volumetric spaces used with Elastic Displays have been evaluated in a user study recently [7].

## Spatial Data (3D)

The category comprises real three dimensional scenes which are not structured in layers or slices. The main purpose is to model 3D space interactively to influence virtual entities in the scene or the scene parameters themselves. Examples include the reproduction of physical effects like gravity simulation, or 3D modeling of surfaces and volumes. By deforming the surface, true spatial data can be explored and manipulated continuously. The *Deformable Workspace* is a prime example for this content [9]. Similarly, *impress* [2] and *eTable* [4] use spatial content.

## References

[1] *Cassinelli, A. and Ishikawa, M.* (2005): **Khronos Projector.** In: Donna Cox (Ed.): SIGGRAPH '05: ACM SIGGRAPH 2005 Emerging technologies. ACM SIGGRAPH 2005: Emerging technologies. Los Angeles, Kalifornien, USA, 31.07.2005. New York, NY, USA: ACM, pp. 10. DOI: [10.1145/1187297.1187308](https://doi.org/10.1145/1187297.1187308)

[2] *Hilsing, S.* (2010): **Impress - A Flexible Display.** [http://www.silkehilsing.de/impress/blog/?cat=5](http://www.silkehilsing.de/impress/blog/?cat=5)

[3] *Kammer, D., Keck, M., Müller, M., Gründer, T. and Groh, R.* (2017): **Exploring Big Data Landscapes with Elastic Displays.** In: Manuel Burghardt, Raphael Wimmer, Christian Wolff and Christa Womser-Hacker (Ed.): Mensch und Computer 2017 - Workshopband. Spielend einfach interagieren. Mensch und Computer 2017, 10. Workshop Be-Greifbare Interaktion (MCI-WS08). Regensburg, Germany, 10.09.2017. Bonn, Deutschland: Gesellschaft für Informatik e. V. (GI). DOI: [10.18420/muc2017-ws08-0342](https:doi.org/10.18420/muc2017-ws08-0342)

[4] *Kingsley, P., Rossiter, J. and Subramanian, S.* (2012): **eTable: A Haptic Elastic Table for 3D Multi-touch Interactions**

[5] *Müller, M., Keck, M., Gründer, T., Hube, N. and Groh, R.* (2017): **A Zoomable Product Browser for Elastic Displays.** In: Luísa Ribas, André Rangel, Mario Verdicchio and Miguel Carvalhais (Ed.): xCoAx 2017: Proceedings of the Fifth Conference on Computation, Communication, Aesthetics and X. xCoAx 2017: 5th Conference on Computation, Communication, Aesthetics & X. Lisbon, Portugal, 06.07.2017 - 07.07.2017, S. 127–136. [http://2017.xcoax.org/pdf/xcoax2017-muller.pdf](http://2017.xcoax.org/pdf/xcoax2017-muller.pdf)

[6] *Müller, M., Knöfel, A., Gründer, T., Franke, I. and Groh, R.* (2014): **FlexiWall: Exploring Layered Data with Elastic Displays.** In: Raimund Dachselt, Nicholas Graham, Kasper Hornbæk und Miguel Nacenta (Ed.): ITS '14: Proceedings of the Ninth ACM International Conference on Interactive Tabletops and Surfaces. TS '14: Interactive Tabletops and Surfaces. Dresden, Germany, 16.11.2014 - 19.11.2014. New York, NY, USA: ACM, pp. 439–442. DOI:[10.1145/2669485.2669529](https://doi.org/10.1145/2669485.2669529)

[7] *Müller, M., Stoll, E., Krauss, A.-M., Hannß, F. and Kammer, D.* (2022): **Investigating Usability and User Experience of Layer-based Interaction with a Deformable Elastic Display.** In: Paolo Bottoni and Emanuele Panizzi (Ed.): AVI 2022: Proceedings of the 2022 International Conference on Advanced Visual Interfaces. AVI 2022: International Conference on Advanced Visual Interfaces. Frascati, Rome, Italy, 06.06.2022-10.06.2022. New York, NY, USA: ACM. DOI: [10.1145/3531073.3531101](htpps://doi.org/10.1145/3531073.3531101)

[8] *Spindler, M., Stellmach, S., and Dachselt, R.* (2009) __PaperLens: Advanced magic lens interaction above the tabletop.__ Proc. ITS 2009, ACM, pp. 69-76. DOI: [10.1145/1731903.1731920](https://doi.org/10.1145/1731903.1731920)

[9] *Watanabe, Y., Cassinelli, A., Komuro, T., and Ishikawa, M.* (2008): **The Deformable Workspace: a Membrane between Real and Virtual Space.** In: 2008 3rd IEEE International Workshop on Horizontal Interactive Human Computer Systems. 2008 3rd IEEE International Workshop on Horizontal Interactive Human Computer Systems. Amsterdam, Netherlands, 01.10.2008 - 03.10.2008. Institute of Electrical and Electronics Engineers. Piscataway, NJ: IEEE, pp. 145–152. DOI=[10.1109/tabletop.2008.4660197](https://doi.org/10.1109/tabletop.2008.4660197)

[10] *Yun, K., Cho, S., Song, J., Bang, H. and Youn, K.* (2013): **ElaScreen: Exploring Multi-dimensional Data using Elastic Screen.** In: Wendy E. Mackay, Stephen Brewster and Susanne Bødker (Ed.): CHI '13 Extended Abstracts on Human Factors in Computing Systems. CHI '13: CHI Conference on Human Factors in Computing Systems. Paris, France, 27.04.2013 - 02.05.2013. New York, NY, USA: ACM, pp. 1311–1316. DOI: [10.1145/2468356.2468590](https://doi.org/10.1145/2468356.2468590)
