---

---
# Welcome to ReFlex Documentation

<img src="/reflex/assets/img/overview/title.jpg" class="content__title-image" alt="Title Image: Elastic Displays">

## What is the ReFlex Framework ?

The ReFlex framework provides an open source, platform independent software framework to develop application for Elastic Displays. Elastic Displays are a specific type of Shape-Changing Interfaces, that feature a deformable surface. The surface deformation can be used for interaction. That means that Elastic Displays provide a from of three-dimensional touch interaction with basic (passive) haptic feedback. More details about the concepts of Elastic Displays are described in the Knowledge Base.

The ReFlex Framework has been developed since 2014. The idea is to provide an easy way to explore interaction concepts for Elastic Displays  and develop applications for this specific hardware.  

{% assign categories = site.data.navigation.toc | where: "type", "category" %}

<div class="sections">
    <div class="sections__item">
        <img class="sections__title-image" src="/reflex/assets/img/overview/software.png" alt="Title Image: Software"/>

        <h2><a href="/reflex{{ categories[0].path }}{{ categories[0].file }}"> {{ categories[0].name }} </a></h2>

        <p>
        This section contains information about the ReFlex software framework. This includes the structure of the github repository, core components, and a short developer documentation.
        </p>

        <p>
        Furthermore, the development tools, application templates for several client technologies and example applications are described.
        </p>
    </div>

    <div class="sections__item">
        <img class="sections__title-image"
        src="/reflex/assets/img/overview/hardware.jpg" alt="Title Image: Hardware"/>

        <h2><a href="/reflex{{ categories[1].path }}{{ categories[1].file }}"> {{ categories[1].name }} </a></h2>

        <p>
        This section contains information about a basic tabletop setup using consumer hardware. It consists of a construction manual for the frame and projector adjustment and the description of the hardware components as well as lessons learned from several iterations of prototypes.
        </p>
    </div>

    <div class="sections__item">
        <img class="sections__title-image" src="/reflex/assets/img/overview/knowledge.png" alt="Title Image: Knowledge Base"/>

        <h2><a href="/reflex{{ categories[2].path }}{{ categories[2].file }}"> {{ categories[2].name }} </a></h2>

        <p>
        This section contains the scientific foundation for the term Elastic Displays and related technologies. There are also descriptions of past prototypes and publications.
        </p>
    </div>
</div>
