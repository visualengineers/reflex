# Projektdokumentation

Projektdokumentationsnotizen um den Fortschritt der Entwicklung zu dokumentieren.
------------------------------------------------------------------------------------------------------------------------------
## 13.05.24
### Bearbeiter: Joel

### Fortschritt:
* Fertigstellung des Prototypen
* Anpassung README
* Erstellung Projektdokumentation

### Herausforderungen / Learnings:
* CSS bei TrackComponent Erstellung
* DropDownMenu

### Nächste Schritte:
* Funktionsweise überarbeiten
* Prototypen stylen

### Zeitaufwand:
* 3h

### Notizen:
* jetzt geht es richtig los
------------------------------------------------------------------------------------------------------------------------------
## 13.05.24
### Bearbeiter: Jonas

### Fortschritt:
* Implemtierung Dropdown
* IMplemntierung Pullup
* Stylechanges an vielen Komponenten
* Umbau des allgemeinen HTML Aufbaus

### Herausforderungen / Learnings:
* Dropdown mit Abhängigkeiten versehen (ngif)
* Layoutprobleme bei TouchArea und Footer(pullup)

### Nächste Schritte:
* versuchen Layoutprobleme zu beheben
* Pullup funktionsfähig machen

### Zeitaufwand:
* 4h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 14.05.24
### Bearbeiter: Jonas

### Fortschritt:
* Pullup Prototyp eingebaut

### Herausforderungen / Learnings:
* -

### Nächste Schritte:
* Pullup schön machen

### Zeitaufwand:
* 1h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 19.05.24
### Bearbeiter: Jonas

### Fortschritt:
* Reparieren Dropdown
* Bearbeitung Pullup
* Stylechanges an vielen Komponenten
* Umbau des allgemeinen HTML Aufbaus

### Herausforderungen / Learnings:
* Dropdown hatte keine SCSS genommen, warum auch immer, nach einer Änderung an der HTML wurde die SCSS dann wieder erkannt, komisch
* Layoutprobleme bei TouchArea und Footer(pullup), Touch area und Timeline und Track sollen sich dynamisch an deren Platz anpassen, klappt noch nicht so richtig

### Nächste Schritte:
* versuchen Layoutprobleme zu beheben

### Zeitaufwand:
* 3h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 21.05.24
### Bearbeiter: Joel

### Fortschritt:
* TouchArea bearbeitet
* EventService um Eingabeevents zu handeln
* TOuchAreaService um Funktionen und Methoden auszulagern

### Herausforderungen / Learnings:
* TouchArea verstehen, Code refactorn

### Nächste Schritte:
* mergen

### Zeitaufwand:
* 4h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 22.05.24
### Bearbeiter: Joel

### Fortschritt:
* TouchArea berarbeitung fortgesetzt

### Herausforderungen / Learnings:
* Code nochmal überarbeiten

### Nächste Schritte:
* mergen

### Zeitaufwand:
* 1,5h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 22.05.24
### Bearbeiter: Jonas

### Fortschritt:
* Offset gefixt um Punkte zu vergrößern/verkleinern
* Bug gefixt, dass PUnkte komisch verschwinden

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
*

### Zeitaufwand:
* 2h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 26.05.24
### Bearbeiter: Joel

### Fortschritt:
* OptionComponent erstellt um die Verbindungsoptionen mit dem TrackingServer zu handlen

### Herausforderungen / Learnings:
* verstehen, wie sich der TrackingServer mit dem Emulator verbindet, um dann den Gestenrecorder zu erweitern

### Nächste Schritte:
* Optionen erweitern und filtern

### Zeitaufwand:
* 3h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 27.05.24
### Bearbeiter: Joel

### Fortschritt:
* Optionen erweitert + Meeting mit Jonas und Tim
* Optionen filtern und localStorage einführen um die Optionen speichern zu können
* Styling und functionality fixes in der options component

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
* eventuell ein neues Dropdown

### Zeitaufwand:
* 4,5

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 28.05.24
### Bearbeiter: Tim

### Fortschritt:
* Plotly Graph eingebaut
* 

### Herausforderungen / Learnings:
* Optionsmenü für Punkte in Plotly (was aber nicht funktioniert)

### Nächste Schritte:
* 

### Zeitaufwand:
* 4h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 06.06.24
### Bearbeiter: Jonas

### Fortschritt:
* Animation/Symbol für Dropdown eingefügt
* Dropdowns etwas angepasst
* Timeline Punkte normalized
* Timeline logisch angepasst
* Timeline overlay geschaffen für aktueller-Frame-strich
* Timeline Logik für Klickbereich implementiert

### Herausforderungen / Learnings:
* aktueller-Frame_Strich auf Klick bewegen lassen

### Nächste Schritte:
* aktueller-Frame_Strich auf Klick bewegen lassen

### Zeitaufwand:
* 5h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 07.06.24
### Bearbeiter: Jonas

### Fortschritt:
* Timeline in Pullup integriert
* Timeline interaktiv gemacht mit klicken

### Herausforderungen / Learnings:
* das ganz mit der Frame/Track/Gestenlogik verbinden

### Nächste Schritte:
* das ganz mit der Frame/Track/Gestenlogik verbinden

### Zeitaufwand:
* 1,5h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 09.06.24
### Bearbeiter: Jonas

### Fortschritt:
* Timeline Buttons hinzugefügt, erstmal ohne große Funktion

### Herausforderungen / Learnings:
* -

### Nächste Schritte:
* -

### Zeitaufwand:
* 0,5h

### Notizen:
* -
------------------------------------------------------------------------------------------------------------------------------
## 11.06.24
### Bearbeiter: Joel

### Fortschritt:
* gesture-data.servcice.ts implementiert

### Herausforderungen / Learnings:
* Welche Daten brauche ich? 

### Nächste Schritte:
* -

### Zeitaufwand:
* 5h

### Notizen:
* -
-------------------------------------------------------------------------------------------------------------------------------
* ## 17.06.24
### Bearbeiter: Joel

### Fortschritt:
* trackComponent implementiert
* gestureDataService implementiert
* TrackComponent arbeitet mit DataService zusammen
* TouchArea arbeitet mit Service zusammen
* es wird ein Gestenobjekt erstellt, welches dem gestureReplayService gegeben wird
* Nutzung der SharedComponents für die TrackComponent

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
* Timeline

### Zeitaufwand:
* 5h

### Notizen:
* -
-------------------------------------------------------------------------------------------------------------------------------
* ## 21.06.24-22.06.24
### Bearbeiter: Jonas

### Fortschritt:
* Hinzufügung von Buttons für die Touch Area im Header
* Einfügung des Logos im Header
* Umbau des Footermenüs in ein Overlay mit Animation
* Einfügung von Nummern bei jedem Punkt
* Hinzufügung von Interpolationslinien auf dem Canvas
* Implementierung der Playanimation auf dem Canvas
* Behebung des Bugs, bei dem immer ein Punkt bei 0/0 lag
* Einbau der Logik für den Reset-Button
* Ersetzung von Link-Buttons durch normale Buttons
* Überarbeitung des Wording
* Entfernung der Segmente aus der Timeline
* Behebung des Header-Menü-Bugs
* Aktualisierung aller Styles und Farben entsprechend den Komponenten-Farben
* Entfernung der Options-Komponente
* Umbenennung von new-timeline in timeline und Entfernung der Timeline-Komponente
* Einbauen eines Hovermenüs mit Logik bei Hovern über die Punkte auf dem Canvas

### Herausforderungen / Learnings:
* das Malen der kreise auf der Timeline für die Animation des Playback (Mathias konnte helfen <3 >)

### Nächste Schritte:
* Overlaymenü verbessern
* sämtliche Bugsfixen (interpolieren, play/pause )

### Zeitaufwand:
* 8,75h

### Notizen:
* -
* 
------------------------------------------------------------------------------------------------------------------------------
* ## 18.6.24 - 22.6.24
### Bearbeiter: Joel

### Fortschritt:
* Interpolation der Geste
* Menus umgebaut auf Shared-Components
* Reworked the Timeline
* Gesture an TrackingServer senden funktioniert
* HoverMenu überarbeitet
* GestureDataService überarbeitet
* Ein ShitLoad of Bug Fixes

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
* es soll einfach funktionieren bitte bitte ich dreh langsam durch

### Zeitaufwand:
* 10h

### Notizen:
* früher anfangen
* 
------------------------------------------------------------------------------------------------------------------------------
* ## 23.6.24
### Bearbeiter: Joel

### Fortschritt:
* Laden und Speichern von Gesten ist nun Möglich
* beim Laden funktioniert im Backend alles soweit gut, das problem ist, dass die Punkte nicht im Canvas gemalt werden...

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
* bug fixes

### Zeitaufwand:
* 2,5h

### Notizen:
* 
* 
------------------------------------------------------------------------------------------------------------------------------
* ## 23.6.24
### Bearbeiter: Jonas

### Fortschritt:
* Schreiben der Repo-Dokumentation

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
* Präsi

### Zeitaufwand:
* 2,5h

### Notizen:
* 
* 
------------------------------------------------------------------------------------------------------------------------------
* ## 24.6.24
### Bearbeiter: Jonas

### Fortschritt:
* Überarbeiten der Präsentation

### Herausforderungen / Learnings:
* 

### Nächste Schritte:
* 

### Zeitaufwand:
* 3h

### Notizen:
* 
* 
------------------------------------------------------------------------------------------------------------------------------