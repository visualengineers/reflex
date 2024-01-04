---
layout: interview
title:  Basically, the display is a trampoline
teaser: Stefan Gehrke and Martin Herrmann on elastic display construction and materials, projection issues and practical challenges.
image: /assets/img/kb/table-construction.jpg
---

**What are the main components of an elastic display?**

Standing in front of the display, you see an elastic interaction surface, an elastic fabric stretched in a frame. A projector and depth camera are mounted in a construction on the rear. We use this to capture the deformation of the interaction surface and project images onto the fabric. That' s the hardware, but of course it needs a corresponding software application to make it work.

**How did you proceed?**

About like this:  

1. Select a projector: best with wide angle, so you get a sufficiently large projection surface even at short distances like table height.
2. Calculate the size of the table: based on the projection surface (width/length/height). Pay attention to the format of the projected image (16:9, 4:3).
3. Select material for the table substructure (wood, metal)
4. Choose type of covering and fabric: e.g. magnetic, clamped, fastened with eyelets or springs. The table size may have to be adjusted accordingly.

**What must be paid extra attention to?**

The table construction must be particularly robust if several people work at the table and frequently bump into it.
A shaky table also distorts the calibration of the depth camera/projector image afterwards, which has an undesirable effect on the performance of the application.
Calculating the table size and surface may be a little tricky. For one thing, it has to fit the format and resolution of the projector and depth camera. This is essential if we are to make full use of the projection surface and at the same time capture the interactions on it in the best possible way. Secondly, the mounting of the fabric has an influence on the size of the table. A spring suspension, for example, needs additional space on the frame.

**What can you say about the materials for the display surface?**

The surface is made of an elastic material and has to meet several requirements. It has to be easy to grip, translucent but not transparent, robust and should allow for the same interactions both at the edge and in the middle. We are currently using Lycra as textile and attaching it to the display frame via a spring-loaded suspension - basically a trampoline.

**What kind of displays have you built so far?**

We have built 4 different elastic tables and an elastic wall. One of the interactive tables can be explored in the Heinz Nixdorf MuseumsForum in Paderborn. So far the displays are all rectangular, but theoretically the display could also have a different shape.

**How do the displays differ?**

The displays differ in their materials, the way the fabric is attached, the orientation (table or wall display) and the beamer and depth camera used. The technology is improving, we are learning. We experimented with the components and created different combinations depending on the application.
For a prototype, for example, we created a simple wooden construction, which is low-cost and easy to do. We were also able to adjust the frame size to improve the spring suspension and create a more even pressure resistance on the display surface.

**I want an elastic display so that my cats can jump on the trampoline at home. Can I just build this myself?**

Nothing could be easier!

**What have you learned from practice?**

It matters where the table is placed. In a bright environment, e.g. outdoors or in well-lit rooms, there may be problems with tracking or visibility of the projected image.   Darkening or covering the table can be a good idea in this case.
Reflections from objects behind the fabric can also distort the depth information. The camera looks a few centimetres through the fabric, so to speak.  
Also, if the gap between the fabric and the picture frame is too large, it can be disturbing for the user, who is then blinded.
Additionally, the fabric gets a bit dirty with time and many interactions, as is unavoidable in a museum, for instance. It is therefore a plus if you can take it off and wash it.

**What will the next display look like?**

Circular and with spring suspension!
