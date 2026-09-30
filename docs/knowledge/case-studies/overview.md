---
title: "Case Studies: Overview"
---

# {{ page.title }}

<!-- omit in toc -->
## Table-of-contents

1. [Purpose and Research Approach](#purpose-and-research-approach)
2. [Chronological Overview](#chronological-overview)
3. [Case Study Profiles](#case-study-profiles)
4. [Case Study Descriptions](#case-study-descriptions)
5. [Summary](#summary)
6. [Case Studies and Framework Development](#case-studies-and-framework-development)

## Purpose and Research Approach

The case studies explore how Elastic Displays can support different application scenarios, with a particular focus on visualizing complex data and developing interaction metaphors that use surface deformation. They document successive prototypes and the framework iterations used to implement them.

Insights from conceiving, implementing, presenting, and discussing these prototypes provide the basis for more general conclusions about Elastic Displays. Feedback from users and experts, together with scientific exchange, informs the development of tools, models, and methods. This follows the [application-oriented research approach](../scientific/challenges_introduction.md#tools---methods---models) underlying the project.

The studies are presented chronologically to make it clear how each iteration draws on observations from earlier work. Consecutive studies do not necessarily address the most closely related topics; their order traces the development of ideas and technical capabilities.

The documentation of the individual case studies is intended to serve as a starting point for future implementations: as a source of inspiration, a record of user feedback on interaction design, and a basis for comparable application contexts and interaction and visualization concepts.

**[⬆ back to top](#table-of-contents)**

![Chronological Order of Case Studies]({{ site.baseurl }}/assets/img/kb/case-studies/case-studies_overview_timelines.png){:.full-width-scheme .transparent-background}

## Chronological Overview

The timeline in the source overview identifies the following main periods of work:

| Year | Case studies                                                                         |
| ---- | ------------------------------------------------------------------------------------ |
| 2012 | [DepthTouch](depthtouch.md)                                                          |
| 2014 | [FlexiWall](flexiwall.md)                                                            |
| 2015 | [DEEP](deep.md)                                                                      |
| 2016 | [Interactive Animations](interactive-animations.md)                                  |
| 2017 | [Glyphboard](glyphboard.md), [Zoomable Product Browser](zoomable-product-browser.md) |
| 2018 | [DeepZoom](deep-zoom.md), [DisPlay](display.md)                                      |
| 2020 | [Construction Progress Visualization](bim.md)                                        |
| 2022 | [Layers](layers.md)                                                                  |

Additional prototypes with a smaller feature set complement these studies. They primarily served to test the tools or briefly explore conceptual ideas and are documented more concisely.

**[⬆ back to top](#table-of-contents)**

## Case Study Profiles

A consistent profile introduces each case study and makes the prototypes easier to compare. It records the prototype's short title and the year in which the main work took place, alongside the following information:

| Profile field     | Description                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Focus             | The main areas of work: concept, implementation, framework, or integration.                                                |
| Format and sensor | The primary display hardware and sensing technology used to explore the scenario.                                          |
| Framework         | The framework iteration used for the implementation.                                                                       |
| Architecture      | The implementation's overall structure and technologies.                                                                   |
| Scenario          | The application context.                                                                                                   |
| Features          | Up to three distinctive characteristics of the case study.                                                                 |
| Publication       | Related scientific publications involving the author, which also provide part of the basis for the case study description. |
| Repository        | The associated source code artifacts.                                                                                      |

The four focus areas distinguish different contributions:

- **Concept:** developing visualization and interaction concepts.
- **Implementation:** building a working prototype.
- **Framework:** extending or refining the framework.
- **Integration:** connecting the application with other components or technologies.

Repository links generally refer to versions that have been updated, prepared for publication, and made compatible with the framework version current at the time of publication. They therefore do not necessarily reproduce the original implementation or its dependencies. The profile's framework and architecture information describes the historical iteration and should be read alongside the published code.

**[⬆ back to top](#table-of-contents)**

## Case Study Descriptions

Following the profile, each case study uses four sections to document its motivation, implementation, application, and findings.

### Research Questions

This section establishes the starting point, drawing on prior work and earlier iterations. It identifies the conceptual and technological questions addressed by the study and briefly describes any contributions to the physical construction of the Elastic Display.

### Features and Limitations

This section outlines the technical approach, including the sensors and frameworks used, how surface deformation is captured, and how it becomes available for interaction. It identifies newly implemented or explored capabilities and explains technological and conceptual limitations.

### Scenario

This section describes the application context and explains the interaction and visualization concepts in detail. Where relevant, it also traces different iterations and subsequent refinements.

### Findings and Discussion

This section summarizes insights from trying out the prototype, feedback from users and experts, and scientific discussion. It identifies further research questions, examines how technical limitations affect the scenario, and explains the study's contribution to the development of tools, models, and methods.

**[⬆ back to top](#table-of-contents)**

## Summary

### Iterative and Parallel Development

Starting with the FlexiWall experimentation environment, the studies generally built on findings from earlier iterations. Some scenarios also developed in parallel: Glyphboard and DeepZoom explored different approaches to zoomable user interfaces, while FlexiWall continued to support early concept exploration using example images, in a manner comparable to paper prototyping.

The following illustration traces these overlapping development periods and their underlying framework iterations: FlexiWall, dSense, and ReFlex. Grey segments represent initial concept development, solid colours indicate active implementation, and transparent segments show maintenance for demonstrations. White and black circles mark demonstrations and publications respectively; dotted connections indicate ports to later framework versions. These ports supported reuse and helped validate the evolving tools.

![Chronological Order of Case Studies with associated framework iteration]({{ site.baseurl }}/assets/img/kb/case-studies/case-studies_overview_timelines_ganntt.png){:.full-width-scheme .transparent-background}

### Demonstrations and Technical Maturity

Comparing demonstration counts by case study and event type reveals that DeepZoom and DisPlay were shown most frequently, with DisPlay's game elements making it particularly suitable for public events. FlexiWall and Layers also featured prominently; considered together as successive approaches to layer interaction, they form the most frequently demonstrated concept. Selection depended partly on explicit requests and positive feedback from earlier events, so these counts reflect the demonstration context.

![Number of Demonstration per Case Study and Event Type]({{ site.baseurl }}/assets/img/kb/case-studies/case-studies_summary_event-type.png){:.full-width-scheme .transparent-background}

In regard to the distribution of demonstrations across several years, FlexiWall, DisPlay, and DeepZoom remained in use over extended periods and at different venues. More prototypes were eventually shown at the same event, while the annual number of presentations did not increase proportionally. The summary interprets this as an indication of a more consistent, stable technical foundation: switching scenarios became possible without physical modifications, reconfiguration, or renewed calibration.

![Number of Demonstrations per Case Study and Year]({{ site.baseurl }}/assets/img/kb/case-studies/case-studies_summary_events-year.png){:.full-width-scheme .transparent-background}

### Research Focus and Open Questions

The studies address the **Application and Content** aspect of the [Grand Challenges for Shape-Changing Interfaces](../scientific/challenges_introduction.md#grand-challenges-for-shape-changing-interfaces) by exploring application scenarios and the distinctive capabilities of Elastic Displays. Their focus reflects the characteristics of manual interaction, especially hand-eye coordination: volumetric data, lenses, and zoomable user interfaces were central topics. Physics-based interaction metaphors were explored mainly in information visualization, with DisPlay also applying them to spatial interaction.

Beyond DisPlay and several smaller prototypes, comparatively few complex spatial interaction scenarios were explored. This remains an opportunity for further research.

**[⬆ back to top](#table-of-contents)**

## Case Studies and Framework Development 

Taken together, the case studies provide the application context needed to understand the framework's functionality and design decisions. Recording the questions, implementation choices, limitations, and findings of each iteration makes it possible to trace how practical experience informed subsequent development.

Observations of users helped examine assumptions and open questions in model development. The range of application contexts also supported requirements elicitation and validation of the reference architecture and tools. Beyond software, the studies enabled the testing and refinement of design methods and hardware, as well as the derivation of design guidelines.

In this documentation, these accounts will also serve as the basis for the forthcoming [requirements analysis](../../software/repo/requirements.md). The individual studies establish the evidence from which shared requirements and the rationale for framework features can be derived.

**[⬆ back to top](#table-of-contents)**
