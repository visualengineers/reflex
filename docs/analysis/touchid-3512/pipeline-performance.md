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

Die größte Zunahme liegt im Tiefenbildpfad außerhalb der Filterung. Dieser Rest wird pro Frame als `depth_ms - filter_ms` berechnet und enthält die Vektorfeldberechnung, Ereignisse und im PR-Branch zusätzlich die Kopie von Punktwolke und Vektorfeld in `TrackingObservation`. Im Observer liegt fast die gesamte Mehrzeit in der Extremumsuche. Die absoluten Zeiten und Prozentwerte stammen aus je einem Lauf auf demselben Rechner.

## Nachmessung der Rasterkopien und Extremumsuche

Die Nachmessung verwendet dieselben Release-Stände, Einstellungen, Recordings und nominellen Zeitstempel. Pro Variante wurden die ersten 72 Frames jeder Aufnahme in einem eigenen Prozess abgespielt. Die ersten 20 Frames je Aufnahme dienen zum Aufwärmen. Damit gehen 208 Frames pro Variante in die Auswertung ein.

Die Stoppuhr in `TrackingObservation` erfasst je Raster die Anlage des Zielrasters und das Kopieren der Werte und Gültigkeitsflags. Die Extremumsuche verwendet weiterhin die eingebaute Metrik `ProcessPerformance.Update`. Zusätzliche Zähler erfassen die Rohkandidaten vor Klassifikation und Konsolidierung, die im Tiefenbildpfad auf dem Replay-Thread und in der parallelen Suche prozessweit allozierten Bytes sowie Änderungen des kumulativen GC-Pausenzählers. Die GC-Werte dienen zum Vergleich der Varianten. Eine Pause lässt sich aus diesem Zähler keiner einzelnen Allokation zuordnen.

Im PR-Build wurden drei Rastermodi verwendet. **Frisch** erzeugt pro Beobachtung neue Raster wie im PR. **Wiederverwendet** kopiert dieselben Werte in bereits angelegte Zielraster. **Direkt** reicht die beiden Quellraster im synchronen Replay durch. Die beiden Kontrollmodi setzen voraus, dass die Analyse vor dem nächsten Frame fertig ist. Die alte Winkelformel `angleX + angleY / 2f` wurde zusätzlich zur korrigierten Formel `(angleX + angleY) / 2f` getestet. Die Instrumentierung und Kontrollmodi lagen in temporären Builds.

### Kosten der Rasterkopien

| Raster | Frisch Median (ms) | Frisch p95 (ms) | Wiederverwendet Median (ms) | Wiederverwendet p95 (ms) |
| --- | ---: | ---: | ---: | ---: |
| Punktwolke | 24,51 | 47,30 | 1,56 | 1,95 |
| Vektorfeld | 47,31 | 81,84 | 1,37 | 1,50 |
| **Beide Raster pro Frame** | **73,16** | **108,15** | **2,97** | **3,25** |

Die Gesamtzeile verwendet die Summe beider Kopierzeiten je Frame. Mit frischen Rastern alloziert der Tiefenbildpfad im Median 61,49 MB pro Frame auf dem Replay-Thread, mit wiederverwendeten Rastern rund 2,38 kB. Die Konstruktoren erklären den Unterschied. Bei 640 × 480 initialisieren sie zwei Bestände von `Point3` und drei Bestände von `Vector2`. Das sind insgesamt rund 1,54 Millionen Objekte pro Frame. Ein Teil der Objekte wird beim Verknüpfen der flachen und gezackten Arrays direkt durch Referenzen auf die flachen Arrays ersetzt. Das Vektorfeld legt außerdem sein separates Interpolationsraster an.

### Ursache der langsameren Extremumsuche

| Build | Raster | Winkelformel | Suche Median (ms) | Suche p95 (ms) | GC-Pause während der Suche, Median (ms) | Rohkandidaten, Median |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| PR | Frisch | Korrigiert | 42,99 | 65,92 | 35,61 | 10.298,5 |
| PR | Frisch | Alt | 42,31 | 67,58 | 34,75 | 9.828,5 |
| PR | Wiederverwendet | Korrigiert | 10,45 | 42,45 | 6,71 | 10.298,5 |
| PR | Direkt | Korrigiert | 11,44 | 31,35 | 6,93 | 10.298,5 |
| PR | Direkt | Alt | 10,86 | 30,80 | 6,90 | 9.828,5 |
| `main` | Direkt | Alt | 10,69 | 30,77 | 6,84 | 9.828,5 |

Mit wiederverwendeten Rastern sinkt die mediane Suchzeit um rund 32,5 ms und die während der Suche erfasste mediane GC-Pause um rund 28,9 ms. Bei gleicher Formel sind die Rohkandidatenzahlen für jeden einzelnen Frame über alle Rastermodi hinweg identisch. Die Suche alloziert selbst in allen Varianten rund 41 MB pro Frame. Der innere Scan erzeugt mit seinen vier `Vector2.Add`-Aufrufen temporäre Vektoren pro gültiger Rasterposition und legt für Treffer Kandidaten an. Die frischen Snapshots erhöhen die Allokationslast vor dieser ohnehin allokationsintensiven Phase. Die Kontrollläufe identifizieren den dadurch erhöhten GC-Aufwand als Haupttreiber der Suchregression.

Die korrigierte Winkelformel erhöht die mediane Rohkandidatenzahl in der Stichprobe um 4,8 %. Mit frischen Rastern liegt die mediane Suchzeit mit der alten Formel nur 0,68 ms niedriger. Mit direkter Rasterübergabe und alter Formel liegen PR und `main` innerhalb von 0,18 ms und liefern pro Frame dieselbe Rohkandidatenzahl. Die Kontrollläufe umfassen je einen Durchlauf pro Variante. Die kleineren Zeitunterschiede sind entsprechend nur als Größenordnung zu lesen.

[Einzelbilddaten der Nachmessung](pipeline-performance-diagnostics.csv)

## Rohdaten

- [Frames auf main](pipeline-performance-main.csv)
- [Frames auf dem PR-Branch](pipeline-performance-pr.csv)

Die CSVs enthalten die nullbasierten Frame-Indizes, Zeiten in Millisekunden, Anzahl veröffentlichter Kontakte und Status pro Frame.
