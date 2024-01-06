---

---
# Welcome to ReFlex Documentation

<img src="/reflex/assets/img/overview/title.jpg" class="content__title-image" alt="Title Image: Elastic Displays">

## What is the ReFlex Framework ?

The ReFlex framework provides an open source, platform independent software framework to develop application for [Elastic Displays]({{ site.baseurl }}/knowledge/terms/elastic-display). Elastic Displays are a specific type of [Shape-Changing Interfaces]({{ site.baseurl }}/knowledge/terms/shape-changing-interface), that feature a deformable surface. The surface deformation can be used for interaction. That means that Elastic Displays provide a from of three-dimensional touch interaction with basic (passive) haptic feedback. More details about the concepts of Elastic Displays are described in the Knowledge Base.

The ReFlex Framework has been under development since 2014. The idea is to provide an easy way to explore interaction concepts for Elastic Displays and provide a toolkit support application development for this specific hardware.

{% assign categories = site.data.navigation.toc | where: "type", "category" %}

<div class="sections">

    {% for category in categories %}

    <div class="sections__item">
        <a href="/reflex{{ category.path }}{{ category.file }}">
            <img class="sections__title-image" src="{{site.baseurl}}{{ category.description.img }}" alt="{{ category.description.img }}"/>
        </a>

        <h2><a href="/reflex{{ category.path }}{{ category.file }}"> {{ category.name }} </a></h2>

        {% for paragraph in category.description.p %}

        <p>{{ paragraph }}</p>

        {% endfor %}
    </div>
    {% endfor %}
</div>
