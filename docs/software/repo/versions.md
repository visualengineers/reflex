---

title: ReFlex Version history

---

# {{ page.title }}

<img src="{{ site.baseurl}}/assets/img/titles/deep.jpg" class="content__title-image" alt="title image showing FlexiWall prototype"/>

 <div class="timeline">      
    <ul class="timeline__year--list">
        {% for v in site.data.version-history.versions %}
        <li class="timeline__year--element">
          <div class="timeline__line" role="presentation"></div>
            <h2 class="timeline__year--date">{{ v.version}}</h2>
            <div class="timeline__version--date">{{ v.date  }}</div>
            <div class="timeline__year--content">               
                <div class="timeline__version--detail">
                    {% if v.library and v.library != nil and v.library.size != 0 %}
                    <div class="timeline__element--title">Library</div>
                    <ul class="timeline__version--list">
                        {% for elem in v.library %}
                            <li> 
                                <div>{{ elem }} </div>
                            </li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                    {% if v.server and v.server != nil and v.server.size != 0 %}
                    <div class="timeline__element--title">Server</div>
                    <ul class="timeline__version--list">
                        {% for elem in v.server %}
                            <li> 
                                <div>{{ elem }} </div>
                            </li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                    {% if v.templates and v.templates != nil and v.templates.size != 0 %}
                    <div class="timeline__element--title">Templates</div>
                    <ul class="timeline__version--list">
                        {% for elem in v.templates %}
                            <li> 
                                <div>{{ elem }} </div>
                            </li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                    {% if v.misc and v.misc != nil and v.misc.size != 0 %}
                    <div class="timeline__element--title">Misc</div>
                    <ul class="timeline__version--list">
                        {% for elem in v.misc %}
                            <li> 
                                <div>{{ elem }} </div>
                            </li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                </div>
            </div>
        </li>
        {% endfor %}
    </ul>
    </div>