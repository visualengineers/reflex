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

## Erneute Messung mit sicherer Wiederverwendung

Im produktiven Pfad kopiert der `InteractionManager` das fertig berechnete Rasterpaar in eigene Puffer. Solange eine Beobachtung wartet, darf der nächste Sensorframe dieses Paar überschreiben. Sobald ein Update sie übernimmt, bleiben die Raster bis zum Abschluss der asynchronen Verarbeitung geschützt. Das zuletzt verarbeitete Paar bleibt für die Distanzberechnung und Diagnostik verfügbar, bis der Observer ein neues verarbeitet hat. Danach kann es als Reserve dienen. Bei geänderter Rastergröße oder Schrittweite wird ein passender Puffer angelegt. Abonnenten des öffentlichen `ObservationReady`-Ereignisses behalten eine unabhängige Kopie.

Für den Vergleich wurden `main` am oben angegebenen Commit und der aktuelle Branch mit der produktiven Wiederverwendung erneut als Release gebaut und nacheinander auf demselben Rechner abgespielt. Einstellungen, nominelle Beobachtungszeitpunkte, vollständige Aufnahmen, Messgrenzen und 20 Aufwärmframes pro Aufnahme entsprechen der ersten Messung. Die Laufzeitmessung verwendet lokales MultiTouch. Die asynchrone Sicherheit wurde separat mit einem angehaltenen Remote-Aufruf, überschriebenen wartenden Frames und einem Wechsel der Rastergröße getestet.

Beide Builds meldeten für alle 1.257 Frames den Status `Available`. Die Tabelle verwendet die 1.177 Frames pro Build nach dem Aufwärmen.

| Aufnahme | Frames | Median main (ms) | Median PR (ms) | Δ Median | p95 main (ms) | p95 PR (ms) | Δ p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 238 | 21,78 | 22,82 | +4,8 % | 41,80 | 65,81 | +57,4 % |
| Line | 320 | 24,59 | 24,68 | +0,4 % | 46,17 | 65,15 | +41,1 % |
| Circle | 209 | 25,77 | 25,74 | −0,1 % | 48,56 | 67,97 | +40,0 % |
| Multi-Touch | 410 | 26,36 | 25,43 | −3,5 % | 46,96 | 67,31 | +43,3 % |
| **Gesamt** | **1.177** | **25,14** | **25,04** | **−0,4 %** | **45,86** | **66,67** | **+45,4 %** |

Gegenüber dem ursprünglichen PR-Lauf sinkt der Median von 134,73 auf 25,04 ms und p95 von 174,84 auf 66,67 ms. Im direkten Vergleich mit dem erneut gemessenen `main` liegen die Mediane nahe beieinander, während der PR beim p95 noch 20,81 ms darüber liegt. Das 30-Hz-Budget von 33,33 ms überschreiten 212 Frames (18,0 %) mit Wiederverwendung und 294 Frames (25,0 %) auf `main`. Der höhere p95 des PR zeigt, dass seine langsamsten Frames trotz der geringeren Zahl von Budgetüberschreitungen länger dauern.

| Stufe | Median main (ms) | Median PR (ms) |
| --- | ---: | ---: |
| Tiefenbildverarbeitung | 12,10 | 12,87 |
| ↳ Filterung inklusive Punktwolken-Update | 7,63 | 7,35 |
| ↳ Rest der Tiefenbildverarbeitung | 4,47 | 5,52 |
| Observer insgesamt | 12,89 | 12,02 |
| ↳ Extremumsuche | 12,79 | 11,87 |
| ↳ Glättung inklusive Konsolidierung im PR | 0,03 | 0,06 |

Die Zahl veröffentlichter Kontakte stimmt für alle 1.257 Frames mit dem ursprünglichen PR-Lauf überein. Die neuen Zeitwerte stammen aus je einem vollständigen Lauf pro Build.

Alle acht Sensorpipeline-Tests bestanden, einschließlich des neuen Tests für einen laufenden Remote-Aufruf, überholte Frames und den Wechsel der Rastergröße. In der gesamten InteractionTests-Suite bestanden 256 von 257 Tests. Der Fehler in `ObservationTimeIsCapturedBeforeRemoteAnalysis` ließ sich mit demselben Ergebnis im unveränderten Ausgangsstand reproduzieren.

[Erneuter Lauf auf main](pipeline-performance-reuse-main.csv) · [PR mit Wiederverwendung](pipeline-performance-reuse-pr.csv)

## Ursachenanalyse der verbleibenden p95-Latenz

In den Einzelbilddaten des Wiederverwendungslaufs steigt p95 der **Extremumsuche** von 33,33 auf 53,55 ms. Der Anstieg um 20,22 ms liegt nahe am Anstieg der gesamten Pipeline um 20,81 ms. Die p95-Werte der Tiefenbildstufe liegen bei 14,14 und 15,37 ms, die der Glättung bei 0,05 und 0,15 ms. Unter den jeweils 59 langsamsten Frames steigt der Median der Extremumsuche von 36,76 auf 56,08 ms. Die Tiefenbildstufe liegt in diesen Frames im Median bei 12,51 bzw. 13,03 ms. Die langsamen Suchläufe treten in allen vier Aufnahmen auf.

### Instrumentierter Replay und Vektor-Kontrolllauf

Drei getrennte Release-Prozesse spielten dieselben vier Recordings vollständig ab. Die Stände waren `main` bei `139a1b4e` und der PR mit Wiederverwendung bei `f7b41e35`. Einstellungen und Zeitgrenzen entsprechen der vorherigen Messung, einschließlich 20 Aufwärmframes je Aufnahme und 1.177 ausgewerteter Frames je Variante. Die Diagnose erfasst innerhalb des parallelen Extremumscans die Änderungen der prozessweiten .NET-Zähler für allozierte Bytes, GC-Pausen, Collections und Lock-Konflikte. Die Suchzeit selbst stammt aus der eingebauten Observer-Metrik.

| Variante | Pipeline Median (ms) | Pipeline p95 (ms) | Suche p95 (ms) | GC-Pause in der Suche p95 (ms) | Suchallokation Median (MB/Frame) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `main` | 25,34 | 49,29 | 34,58 | 24,10 | 41,01 |
| PR mit Wiederverwendung | 25,71 | 70,34 | 56,15 | 34,77 | 41,12 |
| PR mit Wiederverwendung, skalare Vektorrechnung | 16,25 | 38,54 | 23,95 | 15,99 | 2,09 |

Der instrumentierte Lauf reproduziert die p95-Lücke mit **21,05 ms**. Die Suchallokation im Median ist bei beiden Branches nahezu gleich. Im PR dauert die Suche in den 59 langsamsten Pipeline-Frames im Median 62,31 ms gegenüber 38,87 ms auf `main`. Gleichzeitig steigt die erfasste GC-Pause in diesen Frames von 23,46 auf 38,71 ms. Im PR korreliert die Suchzeit stärker mit dem GC-Pausenzähler (Pearson *r* = 0,94) als mit Rohkandidatenzahl (*r* = 0,32) oder Lock-Konflikten (*r* = 0,36). Die prozessweiten Zähler erfassen Pausen, die während der Suche verbucht wurden. Sie trennen gleichzeitig laufende GC-Arbeit und Thread-Scheduling nicht auf. Die Differenzen der p95-Werte lassen sich daher nicht als additive Aufteilung der Lücke lesen.

Die skalare Kontrollvariante berechnet dieselben Vektorsummen und normierten Skalarprodukte mit lokalen `float`-Werten. Sie behält Winkelformel, parallelen Scan, Kandidatenliste und deren Sperre bei. So entfallen die bis zu vier temporären `Vector2`-Objekte je gültiger Rasterposition. Die Suchallokation sinkt um rund 95 %. Rohkandidatenzahl und Zahl veröffentlichter Kontakte stimmen für alle 1.257 Frames mit dem instrumentierten PR überein. In dieser Kontrollvariante liegt der Pipeline-p95 unter dem gemessenen `main`.

### Kontrolle der im Speicher gehaltenen Raster

Drei weitere PR-Prozesse spielten jeweils die ersten 100 Frames jeder Aufnahme ab. Nach dem Aufwärmen blieben 320 Frames je Variante. Alle drei verwendeten den ursprünglichen objektbasierten Scan. Die erste Variante verwendet die produktive Wiederverwendung. Die zweite reicht das Quellrasterpaar im synchronen Replay direkt durch. Die dritte reicht es ebenso direkt durch und hält zusätzlich zwei ungenutzte Snapshot-Paare im Heap. Damit lässt sich der Einfluss der dauerhaft erreichbaren Raster von der Kopierarbeit und dem Rasterzugriff in der Suche trennen.

| PR-Kontrolle | Pipeline p95 (ms) | Suche p95 (ms) | GC-Pause in der Suche p95 (ms) | Suche Median bei Gen2-Collection (ms) |
| --- | ---: | ---: | ---: | ---: |
| Produktive Wiederverwendung | 66,65 | 53,40 | 28,39 | 51,41 |
| Direkte Rasterübergabe | 44,69 | 32,67 | 23,64 | 27,79 |
| Direkte Übergabe, zwei zusätzliche Rasterpaare im Heap | 66,73 | 54,13 | 30,72 | 51,67 |

Alle drei Varianten erzeugen pro Frame dieselbe Kandidaten- und Kontaktzahl. Ohne registrierte Gen2-Collection liegt der Median der Suche in allen drei Varianten zwischen 10,11 und 10,38 ms. Bei produktiver Wiederverwendung fällt in jeden der 16 langsamsten Pipeline-Frames mindestens eine Gen2-Collection während der Suche. Die direkte Rasterübergabe ohne zusätzliche Raster hatte insgesamt sogar mehr Suchfenster mit registrierter Gen2-Collection (100 von 320 gegenüber 48 von 320 mit produktiver Wiederverwendung). Diese Fenster waren jedoch deutlich kürzer.

Die zusätzliche Lebensdauer der Snapshot-Objekte erklärt den p95-Abstand in diesem Replay. Bereits zwei im Heap gehaltene Rasterpaare bringen die Latenzspitzen zurück, obwohl der Scan weiterhin dieselben Quellraster liest und keine Kopierarbeit hinzukommt. Die temporären Vektorobjekte sorgen in beiden Branches für rund 41 MB Suchallokation pro Frame. Zusammen mit den dauerhaft erreichbaren Rasterobjekten wird die Speicherbereinigung auf dem PR in den langsamen Frames teurer. Die skalare Kontrolle zeigt, dass sich die Spitzen auch bei beibehaltenen Snapshots stark reduzieren lassen. Die Diagnosevarianten liefen je einmal in temporären Builds. Direkte Rasterübergabe setzt einen synchronen Replay voraus.

[Einzelbilddaten der p95-Analyse](pipeline-performance-tail.csv)

## Produktive skalare Extremumsuche

`MultiInteractionObserver` berechnet die beiden normierten Skalarprodukte direkt aus den `float`-Komponenten. Pro gültiger Rasterposition entfallen die vier temporären Vektorsummen. Reihenfolge der Rechenoperationen, Mittelwertbildung und Behandlung undefinierter Kosinuswerte entsprechen dem bisherigen PR-Stand. Der parallele Scan und der Snapshot-Pfad bleiben Teil der Messung.

### Vergleich der Erkennung

Zwei separate Verifikationsläufe verglichen den objektbasierten PR-Stand mit der produktiven Skalarrechnung. In allen **1.257 Frames** stimmten die SHA-256-Prüfsummen der nach Rasterposition sortierten Rohkandidaten überein. Verglichen wurden die Bitmuster für X, Y, Z und Konfidenz vor Tiefenumrechnung und Klassifikation. Auch die nach Touch-ID sortierten veröffentlichten Kontakte stimmten in allen Frames überein, einschließlich Position, Konfidenz, Touch-ID, Interaktionstyp, Tracking-Zustand und Extremumsbeschreibung. Der systemzeitabhängige Legacy-Zeitstempel wurde aus dem Vergleich ausgelassen. Die Verifikationsläufe verwendeten dieselben nominellen Zeitstempel und übersprangen die Replay-Wartezeit. Ihre Laufzeiten gingen nicht in die Performance-Auswertung ein.

Die drei zusätzlichen Grenzfalltests prüfen Gleichheit am Grenzwert sowie Nullvektoren und unendliche Komponenten. Der zunächst verbleibende Fehler in `ObservationTimeIsCapturedBeforeRemoteAnalysis` wurde in `f2d2fea4` behoben. Die simulierte Uhr sprang nach dem ersten Remote-Aufruf von 20 s auf 10,1 s zurück. Zwischen den simulierten Abschlüssen lagen 10 s, wodurch der erste Kontakt nach dem Beobachtungs-Timeout von 1 s aus der Zuordnung fiel. Für die Geschwindigkeitsberechnung blieb damit nur eine Messung übrig.

Der korrigierte Test verwendet monotone Aufnahme- und Abschlusszeiten mit unterschiedlichen Latenzen innerhalb des Timeouts. Er prüft die Zuordnung beider Messungen zum selben Kontakt sowie die aus dem Aufnahmeintervall von 100 ms berechnete Geschwindigkeit von 20 Pixeln pro Sekunde. Im vollständigen Release-Lauf bestanden **alle 260 InteractionTests**.

### Release-Replay gegen main

Erneut wurden `main` bei `139a1b4e` und der PR bei `f7b41e35` mit der produktiven skalaren Rechnung auf demselben Rechner gemessen. Die vier vollständigen Aufnahmen, Settings, nominellen Zeitstempel und Messgrenzen entsprechen dem ursprünglichen Replay. Beide Builds meldeten für alle 1.257 Frames `Available`. Die Auswertung enthält 1.177 Frames pro Build nach dem Aufwärmen. Die folgenden Werte stammen aus je einem vollständigen Lauf.

| Aufnahme | Frames | Median main (ms) | Median PR (ms) | Δ Median | p95 main (ms) | p95 PR (ms) | Δ p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 238 | 22,42 | 15,85 | −29,3 % | 45,22 | 26,75 | −40,9 % |
| Line | 320 | 24,80 | 16,18 | −34,7 % | 48,04 | 38,06 | −20,8 % |
| Circle | 209 | 25,66 | 16,38 | −36,2 % | 49,45 | 42,21 | −14,6 % |
| Multi-Touch | 410 | 25,36 | 15,85 | −37,5 % | 46,39 | 36,32 | −21,7 % |
| **Gesamt** | **1.177** | **24,92** | **16,07** | **−35,5 %** | **47,21** | **37,61** | **−20,3 %** |

Die Extremumsuche benötigt im Median 2,46 ms gegenüber 12,58 ms auf `main`. Ihr p95 liegt bei 22,42 statt 33,85 ms. Gegenüber dem früheren PR-Lauf mit Rasterwiederverwendung sinkt der Pipeline-p95 von 66,67 auf 37,61 ms. Das 30-Hz-Budget von 33,33 ms überschritten 313 von 1.177 Frames auf `main` und 83 auf dem skalaren PR.

[Neuer Lauf auf main](pipeline-performance-scalar-main.csv) · [PR mit produktiver Skalarrechnung](pipeline-performance-scalar-pr.csv)

## Vergleich mit aktiviertem und deaktiviertem Snapshot-Schalter

Gemessen wurde der lokale Release-Stand mit dem produktiven Schalter `UseObservationSnapshots` auf Basis von `57cb8907`. Beide Modi verwenden die skalare Extremumsuche, dieselben Einstellungen und die vier vollständigen Recordings. Jeder Modus lief je einmal pro Messaufbau in einem eigenen Prozess auf dem oben beschriebenen Rechner.

- **Synchron** verarbeitet jeder Sensor-Callback seinen Frame vollständig. Nominelle Aufnahmezeitpunkte erlauben den direkten Vergleich mit den bisherigen Laufzeitmessungen. Die gemessene Latenz reicht vom Eintritt in den Sensor-Callback bis zum Abschluss der Analyse. JPEG-Dekodierung und Replay-Wartezeit liegen außerhalb dieses Intervalls.
- **Getrennte Takte** liefert der Replay-Emulator die Frames mit einer Zielrate von 30 Hz. Ein unabhängiger 30-ms-Takt ruft den produktiven `InteractionManager.Update` auf und holt nach dem letzten Sensorframe eine gegebenenfalls noch wartende Beobachtung ab. Die Latenz verwendet die reale monotone Uhr und umfasst die Wartezeit bis zur Verarbeitung. Netzwerk und Server-Broadcast sind in beiden Aufbauten ausgeschlossen.

Median und p95 berücksichtigen nur verarbeitete Frames ab Index 20 jeder Aufnahme. Bei den Ausfällen wird zwischen am Eingang verworfenen und aufbereiteten, aber nicht konsumierten Frames unterschieden. Ein Analyseaufruf ohne neuen Frame zählt dabei nicht als zusätzlicher Frameverlust.

### Synchroner Replay

| Aufnahme | Median an (ms) | Median aus (ms) | p95 an (ms) | p95 aus (ms) | Übersprungen an / aus |
| --- | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 15,68 | 15,24 | 23,19 | 22,44 | 0 / 0 |
| Line | 17,23 | 15,52 | 54,53 | 30,64 | 0 / 0 |
| Circle | 17,24 | 15,72 | 54,91 | 32,78 | 0 / 0 |
| Multi-Touch | 16,17 | 15,29 | 33,90 | 31,35 | 0 / 0 |
| **Gesamt** | **16,30** | **15,43** | **39,77** | **30,75** | **0 / 0** |

Beide Varianten verarbeiteten alle 1.257 Eingangsframes. Mit ausgeschaltetem Snapshot sinkt der Median um rund 0,87 ms und p95 um rund 9,03 ms. Die mediane Tiefenbildstufe sinkt von 13,70 auf 12,64 ms. Der Median der Extremumsuche liegt in beiden Fällen bei rund 2,5 ms. Von den 1.177 Frames nach dem Aufwärmen überschritten 93 mit Snapshot und 33 ohne Snapshot das 30-Hz-Budget von 33,33 ms.

### Replay mit getrennten Takten

Die Latenzen in der Tabelle gelten für verarbeitete Frames nach dem Aufwärmen. Die Framezahlen erfassen die vollständigen Aufnahmen.

| Aufnahme | Median an (ms) | Median aus (ms) | p95 an (ms) | p95 aus (ms) | Übersprungen an / aus |
| --- | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 31,45 | 25,66 | 49,71 | 38,50 | 18 / 103 |
| Line | 31,49 | 26,59 | 57,42 | 44,68 | 25 / 128 |
| Circle | 31,93 | 25,49 | 63,03 | 42,66 | 15 / 81 |
| Multi-Touch | 29,05 | 25,51 | 59,99 | 42,80 | 24 / 157 |
| **Gesamt** | **30,65** | **26,00** | **55,13** | **42,80** | **82 / 469** |

| Status der 1.257 Eingangsframes | Snapshots an | Snapshots aus |
| --- | ---: | ---: |
| Analysiert | 1.175 | 788 |
| Am Sensoreingang verworfen | 0 | 126 |
| Aufbereitet, aber nicht analysiert | 82 | 343 |
| **Übersprungen gesamt** | **82 (6,5 %)** | **469 (37,3 %)** |

Ohne Snapshot reserviert die Analyse das Live-Rasterpaar und der Produzent verwirft währenddessen ankommende Frames. Ist umgekehrt der Produzent beschäftigt, kann der Analyse-Takt kein Live-Raster übernehmen. Bis zum nächsten Takt kann eine neuere Beobachtung die wartende ersetzen. Mit Snapshots können beide Stufen gleichzeitig auf getrennten Rastern arbeiten. Die Pipeline hält jeweils nur die neueste wartende Beobachtung.

Die Latenz ohne Snapshots ist auch auf den 688 nach dem Aufwärmen in beiden Modi verarbeiteten Frames geringer. Median und p95 liegen mit Snapshots bei 28,05 und 50,14 ms, ohne Snapshots bei 26,18 und 43,00 ms. Der niedrigere p95 geht in diesem Lauf mit einer deutlich geringeren Abdeckung der Eingangsframes einher. Die Ausfallquoten hängen vom Takt und der Laufzeitverteilung ab. Die tatsächliche mittlere Eingangstaktrate lag je Aufnahme und Modus zwischen 30,0 und 30,3 Hz.

### Vergleich der Erkennung

Zwei separate synchrone Prüfläufe mit identischen nominellen Aufnahmezeitpunkten lieferten in **allen 1.257 Frames** dieselben SHA-256-Prüfsummen für die Rohkandidaten und veröffentlichten Kontakte. Der Vergleich verwendet dieselben Felder und dieselbe Sortierung wie bei der Prüfung der skalaren Extremumsuche. Der systemzeitabhängige Legacy-Zeitstempel bleibt außen vor. Die Prüfsummen wurden außerhalb der Laufzeitmessungen berechnet.

Bei getrennten Takten unterscheiden sich die verarbeiteten Framefolgen und die tatsächlichen Zeitstempel. Unter den 736 in beiden Modi analysierten Eingangsframes wich die Zahl veröffentlichter Kontakte in 48 Frames ab. In 17 Frames veröffentlichte nur der Snapshot-Modus Kontakte, in 3 nur der Live-Modus. Das sind Unterschiede der zeitabhängigen Pipeline-Ausgabe unter diesem Takt. Der synchrone Vergleich isoliert die Erkennung bei identischer Framefolge.

[Einzelbilddaten zum Snapshot-Schalter](pipeline-performance-snapshot-switch.csv). In der CSV kennzeichnet `SensorDropped` am Eingang verworfene Frames und `NotConsumed` aufbereitete Frames ohne Analyse. Die Analyselatenzen sind für diese Zeilen mit 0 belegt und gehen nicht in die Perzentile ein.

## Rohdaten

- [Frames auf main](pipeline-performance-main.csv)
- [Frames auf dem PR-Branch](pipeline-performance-pr.csv)

Die CSVs enthalten die nullbasierten Frame-Indizes, Zeiten in Millisekunden, Anzahl veröffentlichter Kontakte und Status pro Frame.
