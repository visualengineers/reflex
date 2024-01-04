---
layout: interview
title:  Interactions result in a stream of depth images.
teaser: 
image: /assets/img/kb/flexiwall-mathias.jpg
---

**Why is tracking needed on an elastic display?**  
With the help of tracking we determine the positions, the depth and the type of interaction on the elastic display.

**Can you briefly describe the tracking setup? What is particularly important?**  
Below the surface of the elastic display is a depth camera, e.g. an Azure Kinect, which optimally captures the entire touch surface. In order to avoid recalibrations, a stable and secure positioning of the camera is very important in practice.

**Why did you choose tracking with depth cameras?**  
The camera works on the Time-of-Flight (ToF) principle by emitting light in the near infrared spectrum (NIR) and measuring the time until the reflection of the light arrives again. This allows for direct and fast calculation and transmission of the depth map independent of interfering light, i.e. light that is outside the infrared spectrum. The beamer image projected onto the surface of the elastic display, texture and color of the surface thus do not influence the tracking.

**Gibt es aus technischer Sicht relevante Unterschiede zwischen den aktuell verfügbaren Tiefen-Kameras?**
ToF (Kinect 2, Azure Kinect) - measuring the time emitted light takes from the camera to the object and back, constantly emits infrared light with modulated waves and detects the shifted phase of the returning light
Pattern Projection (Kinect 1) - known infrared pattern is projected into the scene and out of its distortion
the depth is computed
Vergleich: https://www.dfki.de/fileadmin/user_upload/import/8767_wasenmuller2016comparison.pdf

**Which camera do you use and why?**  
For our purposes currently probably the Azure Kinect, as it has the highest resolution and accuracy (1-megapixel ToF imaging chip).

**What data does the camera capture and what does the data stream it sends look like?**

- Depth image (up to 1MP) with depth information per pixel
- Color image (up to 3840x2160 px)
- IR reflection/intensity
- Camera Position (gyroscope and accelerometer)

We use a data stream consisting of the depth image (16-bit grayscale, big-endian encoded) and the RGB color image (mode-dependent, MJPEG, NV12, or YUY2). 

**Are there any other technologies for tracking surface deformation?**
Pattern projection (kinect1)
berührung könnte kapazitiv oder mittels leitfähigen flexiblen stoffen erfasst werden
evtl mechanische auswertung der Interaktion möglich
optisch über seitlich angebrachte stereo kameras
optische Auswertung der durchscheinenden hand / schatten
auch gestenerkennung über sihouette denkbar

**Wie fein (Auflösung) kann man tracken? Was bedeutet das hinsichtlich der möglichen Displaygröße?**
aktuell 1 MP mit Azure Kinect
displaygröße damit weiter skalierbar, aber aus usabilitysicht nicht praktikabel

**Welche Faktoren wirken sich negativ auf die Bildqualität aus?**
https://docs.microsoft.com/de-de/azure/kinect-dk/depth-camera siehe Invalidation
zu starke oder keine Reflektion des IR Signals (Oberflächeneigenschaften)
Umleitung des ausgesendeten lichts durch die geometrie,  multi-path detection (Verlängerung des licht-laufwegs)

**Wie kann man eine hohe Bildqualität sicherstellen?**
Der Stoff ist teilweise durchlässig. Welche Auswirkungen hat das auf das Tiefenbild und wie geht man damit um?

**Auf welche Probleme seid ihr (noch) gestoßen?**

**Was war besonders knifflig?**

**Was habt ihr gelernt?**