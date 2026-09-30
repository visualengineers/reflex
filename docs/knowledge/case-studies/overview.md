---
title: "Case Studies: Overview"
---

# {{ page.title }}

<!-- omit in toc -->
## Table-of-contents

1. [Purpose and Research Approach](#purpose-and-research-approach)
2. [Chronological Overview](#chronological-overview)
3. [Case Study Profiles](#case-study-profiles)
4. [Structure of Each Case Study](#structure-of-each-case-study)
5. [Relationship to the Framework](#relationship-to-the-framework)

## Purpose and Research Approach

The case studies explore how Elastic Displays can support different application scenarios, with a particular focus on visualizing complex data and developing interaction metaphors that use surface deformation. They document successive prototypes and the framework iterations used to implement them.

Insights from conceiving, implementing, presenting, and discussing these prototypes provide the basis for more general conclusions about Elastic Displays. Feedback from users and experts, together with scientific exchange, informs the development of tools, models, and methods. This follows the [application-oriented research approach](../scientific/challenges_introduction.md#tools---methods---models) underlying the project.

The studies are presented chronologically to make it clear how each iteration draws on observations from earlier work. Consecutive studies do not necessarily address the most closely related topics; their order traces the development of ideas and technical capabilities.

**[⬆ back to top](#table-of-contents)**

## Chronological Overview

The timeline in the source overview identifies the following main periods of work:

| Year | Case studies                                                                         |
| ---- | ------------------------------------------------------------------------------------ |
| 2012 | [DepthTouch](depthtouch.md)                                                          |
| 2014 | [FlexiWall](felxiwall.md)                                                            |
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

## Structure of Each Case Study

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

## Relationship to the Framework

Taken together, the case studies provide the application context needed to understand the framework's functionality and design decisions. Recording the questions, implementation choices, limitations, and findings of each iteration makes it possible to trace how practical experience informed subsequent development.

In this documentation, these accounts will also serve as the basis for the forthcoming [requirements analysis](../../software/repo/requirements.md). The individual studies establish the evidence from which shared requirements and the rationale for framework features can be derived.

**[⬆ back to top](#table-of-contents)**

<!-- Summarized from "Werkzeuge und Methoden zur Erforschung von Elastic Displays",
     Chapter 5, introductory overview, pp. 127-129 (case-studies_overview.pdf).
     Chronology follows Figure 5-1; documentation structure follows Figure 5-2. -->
