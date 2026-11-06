# Replay-Performance der Verarbeitungspipeline für PR #3512

Messung vom 6. November 2026 auf einem MacBook Air mit Apple M2 (8 CPU-Kerne), macOS 27.0.1, .NET SDK 10.0.403 und Runtime 10.0.14 (arm64). Gemessen wurden Release-Builds von `main` (`139a1b4ee88f0d57306dd10035f12a903bedc59c`) und `fix/interaction-smoothing-behaviour` (`6ab3d6f9ea19600352e2484efefcef07354c287f`), in dieser Reihenfolge in separaten Prozessen.

## Messaufbau

- Dieselben lokalen JPEG-Recordings aus `tools/ReFlex.TrackingServer/wwwroot/recordings` wurden pro Branch einmal vollständig in numerischer Frame-Reihenfolge abgespielt. Alle vier Aufnahmen haben 640 × 480 Pixel bei nominell 30 Hz.
- Jeder dekodierte Frame durchlief synchron die produktiven Klassen `DepthImageManager` und `InteractionManager` im MultiTouch-Modus. Die Messung beginnt direkt vor `DepthImageManager.Update` und endet nach `InteractionManager.Update`. Dekodierung, Replay-Wartezeit, Server-Timer und Netzwerk liegen außerhalb dieses Intervalls.
- Jeder Branch nutzte sein `TrackingSettings_default.json` mit 1,45 m Referenzebene. Der PR-Branch lief mit 3 Pixeln Konsolidierungsradius, aktivierter linearer Geschwindigkeitsprädiktion (3 Samples, 50 ms Horizont), 100 ms Kontaktretention und 1 s Beobachtungs-Timeout. Auf `main` gilt die konfigurierte Retention von drei fehlenden Frames.
- Im temporären Build des PR-Branches lieferten Tiefenbildmanager und Observer denselben nominellen Zeitstempel `100 + Frameindex / 30` in Sekunden. So blieb die Tracking-Zeit unabhängig von Replay-Pausen und Rechnerlast. Die Laufzeit selbst wurde mit einer monotonen Stoppuhr erfasst. Die Messung bildet damit lokale Rechenzeit bei kontinuierlicher Aufnahme ab. Das Verhalten bei alternden Beobachtungen im laufenden Server erfordert eine Messung mit Echtzeit und Server-Timer.
- `MeasurePerformance` war für Filter und Observer aktiv. `filter_ms` und `observer_ms` sind die Zeitspannen der eingebauten `PerformanceDataUpdated`-Ereignisse. Der Observer meldet vor der Ausgabe der Interaktionen. Die äußere Stoppuhr umfasst auch die Ausgabe. Die eingebauten Teilzeiten für Suche, Tiefenumrechnung, Klassifikation und Glättung stehen in den CSVs.
- Die ersten 20 Frames jeder Aufnahme bleiben als Aufwärmphase in den Rohdaten und sind von der Auswertung ausgenommen. Der Median basiert auf den verbleibenden Frames, p95 auf dem aufgerundeten Rang `ceil(0,95 × n)`. Die Gesamtzeile gewichtet jeden Frame gleich. Prozentwerte beziehen sich jeweils auf `main`.

| Aufnahme | Lokales Recording-Verzeichnis | Frames |
| --- | --- | ---: |
| Half-Circle | `2026-11-03_10-21-51` | 258 |
| Line | `2026-11-03_10-19-39` | 340 |
| Circle | `2026-11-03_10-17-09` | 229 |
| Multi-Touch | `2026-11-03_10-20-23` | 430 |

## Messwerte

Beide Branches lieferten für alle 1.257 Frames den Status `Available`. Nach dem Aufwärmen bleiben je Branch 1.177 Frames. Die lokale Verarbeitung dauert auf dem PR-Branch im Median **5,7-mal so lange** wie auf `main`.

| Aufnahme | Frames | Median main (ms) | Median PR (ms) | Δ Median | p95 main (ms) | p95 PR (ms) | Δ p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 238 | 21,06 | 135,42 | +543,0 % | 41,74 | 175,79 | +321,2 % |
| Line | 320 | 23,27 | 134,67 | +478,6 % | 43,44 | 177,80 | +309,3 % |
| Circle | 209 | 24,60 | 138,34 | +462,3 % | 42,89 | 176,00 | +310,3 % |
| Multi-Touch | 410 | 24,55 | 132,78 | +440,8 % | 45,08 | 171,80 | +281,1 % |
| **Gesamt** | **1.177** | **23,66** | **134,73** | **+469,5 %** | **43,42** | **174,84** | **+302,7 %** |

Das 30-Hz-Zeitbudget von 33,33 ms überschritten auf `main` 298 von 1.177 Frames (25,3 %), auf dem PR-Branch alle 1.177 Frames. Damit reicht in diesem synchronen Replay auf dem PR-Branch bereits die lokale Rechenzeit pro Frame über das Aufnahmeintervall hinaus.

| Stufe | Median main (ms) | Median PR (ms) |
| --- | ---: | ---: |
| Tiefenbildverarbeitung insgesamt | 11,58 | 85,65 |
| ↳ Filterung inklusive Punktwolken-Update | 7,20 | 6,74 |
| ↳ Rest der Tiefenbildverarbeitung | 4,37 | 78,83 |
| Observer insgesamt | 12,05 | 47,30 |
| ↳ Extremumsuche | 11,95 | 47,13 |
| ↳ Tiefenumrechnung | 0,04 | 0,04 |
| ↳ Extremumsklassifikation | < 0,01 | < 0,01 |
| ↳ Glättung inklusive Konsolidierung im PR | 0,03 | 0,06 |

Die größte Zunahme liegt im Tiefenbildpfad außerhalb der Filterung. Dieser Rest wird pro Frame als `depth_ms - filter_ms` berechnet und enthält die Vektorfeldberechnung, Ereignisse und im PR-Branch zusätzlich die Kopie von Punktwolke und Vektorfeld in `TrackingObservation`. Der Anteil der Kopie wurde nicht separat gestoppt. Im Observer liegt fast die gesamte Mehrzeit in der Extremumsuche. Die Messung vergleicht die Branches als Ganzes und trennt die Kosten einzelner Codeänderungen nicht auf. Die absoluten Zeiten und Prozentwerte stammen aus je einem Lauf auf demselben Rechner.

## Rohdaten

- [Frames auf main](pipeline-performance-main.csv)
- [Frames auf dem PR-Branch](pipeline-performance-pr.csv)

Die CSVs enthalten die nullbasierten Frame-Indizes, Zeiten in Millisekunden, Anzahl veröffentlichter Kontakte und Status pro Frame.
