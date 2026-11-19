# Replay-Vergleich: bisherige Bewegungsvorhersage und Kalman-Filter

19. November 2026, Produktionscode von `95650caf` auf `feature/##36-kalman-filter`.
**Mit den aktuellen Parametern verschlechtert der Kalman-Schalter die ID-Stabilität deutlich:**
Die Zahl neu angelegter Tracks steigt von **38 auf 77 (+102,6 %)**. Die drei Aufzeichnungen mit
einem bewegten Ziel zeigen zusammen **0 → 25 ID-Wechsel** in der veröffentlichten Ausgabe.
Die Tracking-Berechnung ist zugleich deutlich schneller. Zwei separate Messprozesse bestätigen
identische Qualitätswerte; die Laufzeiten schwanken zwischen den Prozessen.

Der Kalman-Filter sollte deshalb vorerst optional und standardmäßig deaktiviert bleiben.
Die Messung bewertet die aktuelle Implementierung und Parametrisierung, keine grundsätzliche
Überlegenheit oder Unterlegenheit von Kalman-Filtern.

## Vergleichsaufbau

Beide Varianten verwenden dieselbe aktuelle `InteractionSmoothingBehaviour`-Implementierung.
**Nur `UseKalmanFilter` wird umgeschaltet.** In beiden Varianten bleiben globale Minimum-Cost-Zuordnung,
explizite Miss-/Birth-Kosten und die feste Trennung von Push/Pull aktiv. Damit wird die neue
Drucktyp-Regel nicht versehentlich als Effekt des Kalman-Filters gemessen.

| Variante | Bewegungsvorhersage | XY-Ausgabeglättung |
| --- | --- | --- |
| `linear3` | bisheriger linearer Fit aus drei tatsächlichen Messungen | bisheriger Moving Average, drei Samples |
| `kalman` | rekursives Constant-Velocity-Modell | Kalman-Posterior |

Der Vergleich erfasst den **gesamten Kalman-Schalter einschließlich XY-Glättung**, nicht nur den
Austausch der Forecast-Funktion. Die zusätzliche Auswertung der rohen Zuordnungen zeigt, ob sich
bereits die Kontaktzuordnung vor Glättung und Veröffentlichung verändert.

Verwendet wurden die vorhandenen Aufzeichnungen und die schon für den
[Greedy/Global-Vergleich](assignment-comparison.md) erzeugten Vor-Zuordnungs-Messungen:

| Aufnahme | Verzeichnis unter `wwwroot/recordings` | Frames | Messungen |
| --- | --- | ---: | ---: |
| Half-Circle | `2026-11-03_10-21-51` | 258 | 398 |
| Line | `2026-11-03_10-19-39` | 340 | 177 |
| Circle | `2026-11-03_10-17-09` | 229 | 229 |
| Multi-Touch | `2026-11-03_10-20-23` | 430 | 1363 |
| **Gesamt** | | **1257** | **2167** |

Alle acht Capture-/Referenzdateien stimmen per SHA-256 mit den Eingängen des früheren Vergleichs
überein. Verwendet werden ausschließlich dessen `measurements` mit ursprünglicher Detektorkonfidenz
und die unabhängig aus den JPEGs ermittelten stärksten Druckregionen. Frühere zugeordnete IDs und
geglättete Ausgaben sind **kein** Eingang dieses Vergleichs. Detektion und Konsolidierung werden
nicht zwischen den Varianten wiederholt.

Gemeinsame Einstellungen: nominell 30 Hz, Zeitstempel `100 + frame/30`, History 15,
Moving Average mit drei Samples für den bisherigen Modus und die unveränderte Z-Glättung,
Depth Scale 490, striktes Manhattan-Gate `< 81 px`, Miss-/Birth-Kosten jeweils 0,5,
Publikations-Clusterdistanz 58, Konfidenz-Minimum 0 und Maximum 30, Aufbau/Abbau 30/s,
Retention 0,1 s, Observation Timeout 1 s. Die Erfassung verwendete 3 px Extremum-Konsolidierung.
Vorhersage ist eingeschaltet, Beschleunigung ausgeschaltet; der Diagnosehorizont beträgt 0,05 s.
Die Zuordnung prognostiziert auf den aktuellen Beobachtungszeitpunkt, nicht um weitere 0,05 s voraus.

Kalman verwendet die unveränderten Implementierungswerte: Messvarianz `R = 4 px²`,
Prozessspektraldichte `q = 400 px²/s³`, initiale Geschwindigkeitsvarianz `10000 (px/s)²`.
Es wurde **keine** nachträgliche Parameteroptimierung auf diesen Aufnahmen vorgenommen.

## Metriken und Grenzen

- **ID-Wechsel:** nächster veröffentlichter Zielkontakt zur stärksten Druckregion im Quellbild;
  gezählt nur zwischen unmittelbar aufeinanderfolgenden Frames mit aktivem Eingang und
  vorhandenem Zieloutput in beiden Frames. Unterbrechungen setzen die Vergleichskette zurück.
  Bei Half-Circle wird die stationäre Region im Radius 60 px um (249,210) ausgeschlossen.
- **Neue Tracks:** alle intern neu vergebenen IDs, einschließlich Tentative-, stationärer,
  durch Konfidenz gefilterter und durch Clustering unterdrückter Kontakte. Das sind keine
  nachgewiesenen neuen physischen Berührungen.
- **Rohe ID-Wechsel:** dieselbe Referenzauswahl unter den tatsächlich zugeordneten Messungen,
  vor Ausgabeglättung, Konfidenzfilter und Publikations-Clustering; ebenfalls nur konsekutive
  aktive Frames mit vorhandenem Ziel. Das ist eine ergänzende Zuordnungsdiagnose.
- **Multi-Touch:** ohne annotierte Fingertrajektorien ist die Zahl physischer ID-Wechsel
  nicht bestimmbar. Die stärkste Region kann zwischen Fingern wechseln; deren repräsentative
  Wechsel werden separat ausgewiesen und nicht zu den Einzelziel-Wechseln addiert.

Es gibt keine unabhängige Ground Truth. Insbesondere werden kein Positions-RMSE, keine kalibrierte
Unsicherheitsabdeckung und keine allgemeine Sensor-Genauigkeit aus diesen Daten abgeleitet.
Auch die Einzelziel-ID-Wechsel sind reproduzierbare Referenzmetriken, keine manuell annotierten
MOT-Identitätsmetriken. Konfidenz-/Ausgabelücken können interne Fragmentierung verdecken.

## ID-Stabilität und neue Kontakte

Alle Zellen zeigen **bisherige Vorhersage → Kalman**. Die Qualitätswerte sind in beiden Prozessen identisch.

| Aufnahme | ID-Wechsel im Zieloutput | Neue Tracks | Veröffentlichte Ziel-IDs | Aktive Frames ohne Zieloutput |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 0 → 2 | 4 → 6 | 3 → 5 | 10 → 10 |
| Line | 0 → 5 | 9 → 14 | 7 → 12 | 25 → 25 |
| Circle | 0 → 18 | 1 → 22 | 1 → 18 | 1 → 1 |
| Multi-Touch | nicht annotiert | 24 → 35 | 10 → 17 | 4 → 4 |

Aktive Quellbild-Frames: 154 / 198 / 229 / 407. Die unveränderte Anzahl fehlender Zieloutputs
bedeutet nicht, dass die ausgegebenen IDs stabil bleiben.

| Ergänzende Diagnose | Half-Circle | Line | Circle | Multi-Touch |
| --- | ---: | ---: | ---: | ---: |
| Rohe repräsentative ID-Wechsel | 0 → 2 | 3 → 8 | 0 → 21 | 5 → 6 |
| Veröffentlichte stärkste-Region-Wechsel | 0 → 2 | 0 → 5 | 0 → 18 | 3 → 7 |

Die rohen Änderungen belegen, dass die Verschlechterung nicht allein durch die andere
XY-Ausgabeglättung oder die Auswahl veröffentlichter Kontakte entsteht.

### Nachvollziehbares Beispiel: Circle

Circle liefert genau eine Messung in jedem Frame, durchgehend mit demselben Drucktyp.
Der bisherige Modus erhält eine einzige ID über alle 229 Frames. Kalman erzeugt 22 IDs.
Bei allen **21 Wechseln der rohen Zuordnung** wird eine neue ID angelegt; der vorherige Track
ist Lost, hat denselben Drucktyp und seine Forecast-Distanz zur aktuellen Messung liegt außerhalb
des Gates: **81,50 bis 137,84 px** bei erlaubten `< 81 px`.

Beim ersten Abbruch, Frame **49** (nullbasiert), liegt die Messung bei `(312,66; 267,68)`.
Die Kalman-Prognose von ID 0 liegt bei `(363,44; 222,28)`: Manhattan-Abstand **96,18 px**.
Die Messung im vorigen Frame lag bei `(330; 250)`; die direkte Messverschiebung beträgt nur
**35,02 px**. Der Abbruch entsteht hier durch den Forecast außerhalb des Gates, nicht durch
einen Drucktypwechsel, eine ausgebliebene Messung oder einen unmittelbaren Messsprung über 81 px.

Die Details aller repräsentativen Zuordnungswechsel einschließlich Messung, vorherigem
Matching-Ziel, Distanz, Drucktypvergleich und letzter Messzeit stehen in
[association-changes.csv](kalman-comparison/process-1/association-changes.csv).
Der Befund ist mit einem für diese schnelle Richtungsänderung zu trägen Bewegungszustand vereinbar.
Das ist eine Interpretation; die Messung isoliert nicht, welcher alternative R-/q-Wert oder welches
andere Bewegungsmodell das Problem ausreichend lösen würde. Auch unmittelbar aufeinanderfolgende
Neuanlagen mit anfänglich null Geschwindigkeit tragen zur weiteren Fragmentierung bei.

## Laufzeit

Release, .NET SDK 10.0.403 / Runtime 10.0.14, macOS 27.2.1, Arm64, acht logische Prozessoren.
Pro Aufnahme und Prozess: zehn vollständige Warm-up-Replays je Variante, anschließend
31 vollständige Replays mit jeweils frischem Trackerzustand in alternierender AB/BA-Reihenfolge.
Zwei Prozesse wurden nacheinander ausgeführt: insgesamt **77.934 gemessene Frames je Variante**.
Kein erzwungenes GC und keine Isolation von sonstigen Betriebssystemaktivitäten.

Getrennte Stopwatch-Intervalle erfassen `Tracker.Update` und das anschließend ausgeführte
`GetVelocities`. Letzteres liefert die Bewegungsdaten für die Processing-Visualisierung.
Die kombinierte Zeit ist die Summe beider Intervalle **je Frame**; ihre Quantile sind nicht die
Summe der separat berechneten Quantile. Angegeben sind Median und p95 über alle Frames der
31 Wiederholungen, p95 mit Rang `ceil(n × 0,95)`. Leere Frames und Neuanlagen sind enthalten.

**Nur `Tracker.Update`, Mikrosekunden je Frame:**

| Aufnahme | Bisherig Prozess 1 Median / p95 | Kalman Prozess 1 Median / p95 | Bisherig Prozess 2 Median / p95 | Kalman Prozess 2 Median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 50,96 / 107,33 | 11,46 / 16,67 | 60,25 / 118,25 | 12,08 / 16,21 |
| Line | 11,00 / 29,92 | 1,25 / 3,13 | 19,42 / 33,25 | 5,54 / 8,17 |
| Circle | 17,04 / 31,17 | 1,33 / 3,00 | 15,63 / 32,08 | 1,63 / 3,00 |
| Multi-Touch | 41,71 / 166,00 | 2,83 / 8,17 | 47,42 / 186,42 | 2,83 / 8,33 |

**`Tracker.Update` plus `GetVelocities`, Mikrosekunden je Frame:**

| Aufnahme | Bisherig Prozess 1 Median / p95 | Kalman Prozess 1 Median / p95 | Bisherig Prozess 2 Median / p95 | Kalman Prozess 2 Median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 91,46 / 228,42 | 12,50 / 18,38 | 111,46 / 245,71 | 13,38 / 17,75 |
| Line | 22,04 / 60,08 | 1,42 / 3,50 | 33,42 / 66,33 | 6,21 / 9,00 |
| Circle | 33,46 / 58,75 | 1,50 / 3,33 | 29,92 / 60,63 | 1,88 / 3,67 |
| Multi-Touch | 82,75 / 353,54 | 3,17 / 9,25 | 94,71 / 415,46 | 3,17 / 9,50 |

Die isolierten `GetVelocities`-Mediane liegen je nach Aufnahme/Prozess bei **10,63–48,88 µs**
für die bisherige Vorhersage und **0,08–1,21 µs** für Kalman. Die vollständigen getrennten
Quantile stehen in den Ergebnisdateien.

Der Laufzeitvorteil passt zum Implementierungsunterschied: `ContactMotion.Estimate` berechnet
erneut Polynom-Fits für X/Y/Z, sowohl bei der Zuordnung als auch bei der Bewegungsdiagnostik.
Kalman aktualisiert einen kleinen persistenten XY-Zustand und fragt ihn für die Diagnose ab.
Die Varianten besitzen durch ihre unterschiedlichen Zuordnungen aber auch unterschiedliche
Trackverläufe. Gemessen wird das Verhalten des Schalters auf diesen Replays, kein Rechenvergleich
bei künstlich identischer Anzahl und Lebensdauer von Tracks.

Ausgeschlossen sind JSON-Verarbeitung, Trackerkonstruktion, JPEG-Decodierung, Sensorfilter,
Extremumerkennung, Konsolidierung, Referenzmetriken, Publikations-Clustering, Kalibrierung,
Unsicherheitskonturen, Angular-Rendering, Netzwerk und Server-Timer. Das sind **keine**
End-to-End-Latenzen oder FPS-Messungen. Die nominellen Beobachtungszeiten verhindern, dass ein
schnellerer Modus allein wegen anderer Timeout-Zeitpunkte besser abschneidet.

## Konsequenz

Der aktuelle Kalman-Schalter erfüllt hier das Laufzeitziel, aber nicht das Ziel stabilerer IDs.
Vor einer Empfehlung zur Aktivierung sollten R/q und die Reaktion auf schnelle Richtungswechsel
untersucht und auf getrennten Validierungsdaten geprüft werden. Ein bloßes Aufweiten des Gates
würde zugleich die Mehrkontakt-Zuordnung verändern und ist durch diesen Vergleich nicht begründet.
Ein covariance-basiertes Gate bleibt eine getrennte mögliche Weiterentwicklung und setzt belastbare
Unsicherheitsannahmen voraus. Produktionsparameter wurden für diese Analyse nicht geändert.

## Artefakte, Reproduktion und Prüfungen

- [Vergleichsprogramm](../../touchid-analysis/MotionComparison.cs) und
  [Aufrufbeschreibung](../../touchid-analysis/README.md#paired-linear-predictionkalman-comparison).
- Prozess 1: [Ergebnisse und Provenienz](kalman-comparison/process-1/results.json),
  [Frame-Metriken](kalman-comparison/process-1/frames.csv),
  [Zuordnungswechsel](kalman-comparison/process-1/association-changes.csv),
  [Replay-Laufzeiten](kalman-comparison/process-1/timing-replays.csv),
  [rohe und veröffentlichte Tracks](kalman-comparison/process-1/tracks.json).
- Prozess 2: [Ergebnisse und Provenienz](kalman-comparison/process-2/results.json),
  [Frame-Metriken](kalman-comparison/process-2/frames.csv),
  [Zuordnungswechsel](kalman-comparison/process-2/association-changes.csv),
  [Replay-Laufzeiten](kalman-comparison/process-2/timing-replays.csv),
  [rohe und veröffentlichte Tracks](kalman-comparison/process-2/tracks.json).

Die Ergebnisdateien enthalten Eingangs- und Quellcode-SHA-256, vollständige Standardeinstellungen,
explizite Vergleichs-Overrides, Laufzeitumgebung und Warm-up-/Wiederholungszahlen. Die temporären
Eingangscaptures lagen unter `/tmp/reflex-assignment-20261119`; mit den vorhandenen JPEG-Aufnahmen
können sie gemäß README erneut erzeugt werden. Hashes unterscheiden identische Wiederverwendung
von einer neuen Erfassung mit eventuell verändertem Vorverarbeitungscode.

Release-Build und beide vollständigen Vergleichsläufe erfolgreich. Laufzeitprüfungen kontrollieren
Frame-/Zeitstempelausrichtung, endliche Trackingpositionen und Kalman-Varianzen sowie die Anzahl
vergebener IDs in jedem gemessenen Replay gegen den Qualitätslauf. Eine unabhängige Auswertung
der CSV-/JSON-Artefakte prüft Summen, ID-Wechsel, Prozessgleichheit und Datei-Hashes.
