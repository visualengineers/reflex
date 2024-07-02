---
title: "Models: Task Taxonomy"
---

# {{ page.title }}

## Introduction

Describing applications for Elastic Displays by categorization based on [data types](models_data-taypes.html) has some limitations, as it allows no distinction between content and the metaphors that are used to interact with the content. For example, *DEEP - Data Exploration on Elastic Projections*, uses physical interaction metaphors based on spatial deformation to interact with a zoomable user interface. In the data-model, the content is pure planar 2D, whereas interaction is based on concepts that we associated with the spatial 3D domain.

Additionally, we found that the technological foundation also plays a certain role for the interaction design - not only as limiting factor, but also by empowering certain specific interaction metaphors (e. g. unconstrained masking capabilities when using pixel blending concepts based on the depth image)

Therefore, the model was extended to a task taxonomy [4], that contains a technology layer, data layer and interaction layer and additionally tries to describe the most common task types that are suitable for Elastic Displays. It is inspired by *Shneiderman’s* **Task by Data Type Taxonomy for Information Visualization** [7] and  is based on practical experiences with existing prototypes
and reviews of literature.

![Task Taxonomy for Elastic Displays]({{ site.baseurl }}/assets/img/kb/scientific/task_taxonomy.png){:.full-width-scheme}

## Data Layer

The data layer serves as the foundation of the model. The detailed description can be found in [Models: Data Types](models_data-taypes.html).

## Technology Layer

On this level, we distinguish five different technological concepts for making the content types described above accessible on an Elastic Display. Although there is no strict 1:1 mapping between data and technology, some data types are more commonly used with specific technologies (e.g. Pixel Blending and Volumetric content), which we try to visualize by the position and the extension of the technology fields.

### Image Sequences

The most basic concept is using image sequences that are subsequently displayed according to different depth values. Only the depth value of the global maximum is computed, ignoring the lateral position. Using this approach, a large number of images can be used, and a smooth, stable interaction is achieved. The disadvantages consist of a very limited user interface and a low expressiveness of the interaction. Both the Time Domain Viewer from *ElaScreen* [8] and the *FlexiWall* Big Data Layers application [3] use
this basic technology.

### Pixel-Based Blending

This approach is based on blending several images based on the depth image. It is suitable for rapid prototyping using either planar or volumetric data. Disadvantages are the limited number of images and real user interface elements cannot be used. However, the effect is appealing and is used most
frequently in the reviewed applications: *Khronos Movie Viewer* [1], *impress* 3D-modelling [2], *ElaScreen* 3D Scene Navigation [8], *eTable* 3D-viewer [5] as well as *FlexiWall* Image Effects, Map Viewer, and Painting Explorer [6].

## Interaction Layer



## Tasks



## References

[1] *Cassinelli, A. and Ishikawa, M.* (2005): **Khronos Projector.** In: Donna Cox (Ed.): SIGGRAPH '05: ACM SIGGRAPH 2005 Emerging technologies. ACM SIGGRAPH 2005: Emerging technologies. Los Angeles, Kalifornien, USA, 31.07.2005. New York, NY, USA: ACM, pp. 10. DOI: [10.1145/1187297.1187308](https://doi.org/10.1145/1187297.1187308)

[2] *Hilsing, S.* (2010): **Impress - A Flexible Display.** [http://www.silkehilsing.de/impress/blog/?cat=5](http://www.silkehilsing.de/impress/blog/?cat=5)

[3] *Kammer, D., Keck, M., Müller, M., Gründer, T. and Groh, R.* (2017): **Exploring Big Data Landscapes with Elastic Displays.** In: Manuel Burghardt, Raphael Wimmer, Christian Wolff and Christa Womser-Hacker (Ed.): Mensch und Computer 2017 - Workshopband. Spielend einfach interagieren. Mensch und Computer 2017, 10. Workshop Be-Greifbare Interaktion (MCI-WS08). Regensburg, Germany, 10.09.2017. Bonn, Deutschland: Gesellschaft für Informatik e. V. (GI). DOI: [10.18420/muc2017-ws08-0342](https:doi.org/10.18420/muc2017-ws08-0342)

[4] *Kammer, D., Müller, M., Wojdziak, J. and Franke, I. S.* (2018): **New Impressions in Interaction Design: A Task Taxonomy for Elastic Displays.** In: i-com 17 (3), S. 247–255. DOI: [10.1515/icom-2018-0021](https://doi.org/10.1515/icom-2018-0021).

[5] *Kingsley, P., Rossiter, J. and Subramanian, S.* (2012): **eTable: A Haptic Elastic Table for 3D Multi-touch Interactions**

[6] *Müller, M., Knöfel, A., Gründer, T., Franke, I. and Groh, R.* (2014): **FlexiWall: Exploring Layered Data with Elastic Displays.** In: Raimund Dachselt, Nicholas Graham, Kasper Hornbæk und Miguel Nacenta (Ed.): ITS '14: Proceedings of the Ninth ACM International Conference on Interactive Tabletops and Surfaces. TS '14: Interactive Tabletops and Surfaces. Dresden, Germany, 16.11.2014 - 19.11.2014. New York, NY, USA: ACM, pp. 439–442. DOI:[10.1145/2669485.2669529](https://doi.org/10.1145/2669485.2669529)

[7] *Shneiderman, B.* (1996): **The eyes have it: A task by data type taxonomy for information visualizations.** In Visual Languages, 1996. Proceedings., IEEE Symposium on, IEEE, 336–343. DOI: [10.1109/VL.1996.545307](https://doi.org/10.1109/VL.1996.545307)

[8] *Yun, K., Cho, S., Song, J., Bang, H. and Youn, K.* (2013): **ElaScreen: Exploring Multi-dimensional Data using Elastic Screen.** In: Wendy E. Mackay, Stephen Brewster and Susanne Bødker (Ed.): CHI '13 Extended Abstracts on Human Factors in Computing Systems. CHI '13: CHI Conference on Human Factors in Computing Systems. Paris, France, 27.04.2013 - 02.05.2013. New York, NY, USA: ACM, pp. 1311–1316. DOI: [10.1145/2468356.2468590](https://doi.org/10.1145/2468356.2468590)
