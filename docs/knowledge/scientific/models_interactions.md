---
title: "Models: Interactions"
---

# {{ page.title }}

## General Observations on Interactions on Elastic Displays

The deformable surface offers a wide variety of possible types of interactions. Besides the type of the deformation, there are basically some general aspects that influence the interaction with the surface:

1. __Push and Pull__
   Although the surface can be either pushes or pulled, pushing is far more convenient and intuitive. Pulling the surface means  that the user has to grasp before lifting up the fabric, which requires some training to get used to due to the surface tension of the fabric. Also, the positional accuracy is far less than when pushing into the surface. Finally, it is very unlikely for the user to pull out more than one point of the surface, whereas pushing three or more points into the surface ca be easily done.
   Therefore, push and pull represent two very different interactions, despite they seem to be related at first glance.

   One design guideline is to use pulling very sparingly and only for special discrete actions, e.g. for reset or return to an initial state.
2. __The finite interaction volume__
   The space that can be explored is limited by the borders of the frame and also the third dimension is not endless, but has a maximum depth defined by the elasticity of the fabric. This can be either seen as a limitation, but also as an advantage: In contrast to in-the-air gestures often employed by Natural User Interfaces, the display itself defines and communicates clear boundaries for the interaction and thus for the space that can be explored by the hands.

   One design guideline is that the interaction volume can be used to convey the boundaries of a data set.
3. __The heterogeneous interaction volume__
   The maximum deformation of the fabric varies over the surface: Deformation on the edges is far more difficult and maximum reachable depth far less than in the center of the screen.

   One design guideline is that interaction should mainly take place towards the center of the screen, and interactions should be designed that maximum deformation is not necessary to be reached at the borders of the screen.

![Different types of interactions that can be used with Elastic Displays]({{ site.baseurl }}/assets/img/kb/scientific/interactions.png){:.full-width-scheme}

## Fingers

Interacting with one or multiple fingers represents one of the basic interactions that resembles the familiarity with multi-touch interaction. A single finger can represent a specific point in 3d space. Two fingers from a line and can be used to describe a relationship or specify a distance. With 3 fingers, a plane is formed. Finally, 4 or more fingers can be used to define an arbitrary relief.

This type of interaction can be interpreted as touch interaction extended with a depth dimension or intensity specification.

*It should be noted, that the physical effort to deform the fabric is far more demanding than moving fingers on a touch screen. Therefore, users tend to use the hole hand or their fists to control the deformation (this especially applies unexperienced users).*

## Planar Shapes

Elastic Displays can also be deformed using tangibles. in its most basic form, a planar shape can be used as lens looking into another data dimension or a frame for a different data set, when being interpreted as parallel to the image or zero plane. Tilting the shape extends this concept into a volume slicing tool.

This type of interaction can be interpreted a using a planar tangible in a spatial context (including rotation).

## Tangibles / Arbirary Shapes

The use of tangibles is not limited to planar shapes. Instead, any arbitrary surface can be used to deform the surface. By doing so, a specific surface relief can be formed (or used for manipulation). Alternatively, this concept can be used as as complex 3d masking interaction.

This type on interaction uses tangibles positioned in 3d space and use the three-dimension surface structure for complex manipulations.
