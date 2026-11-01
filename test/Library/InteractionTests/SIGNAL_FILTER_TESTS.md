# Regressionstests der Interaktionsfilter

`SignalFilterTest` prüft die sechs Positionsfilter unabhängig von Kontakterkennung und TouchId.
`TemporalTrackingTest` und `PipelineConsistencyTest` ergänzen die Integration in den Tracker,
insbesondere tatsächliche Zeitabstände und den persistenten Butterworth-Zustand je Kontakt.

## Vertrag und Korrekturen

- Jeder Eingangspunkt erhält einen Ausgangspunkt; auch erster und letzter Wert werden geprüft.
- Leere Listen ergeben leere Listen. Die bestehende ungetimte `null`-API liefert weiterhin `null`.
- Ergebnisse besitzen eigene Punkte, auch während der Anlaufphase. Savitzky–Golay gab hier
  bisher die Eingabeliste direkt zurück.
- Mittelwerte akkumulieren X/Y/Z in `double` und normieren vor der Rückwandlung nach `float`.
  Damit überlaufen große endliche Signale nicht schon bei der Addition oder Gewichtung.
  Beim gewichteten Mittelwert wird auch die Gewichtssumme ohne Integer-Überlauf berechnet.
- Der gewichtete Polynomfit verwendet jetzt tatsächlich unterschiedliche, deterministische
  Gewichte: `w(t) = 1 + (t - t_alt)/(t_neu - t_alt)`. Der älteste Zeitpunkt erhält 1, der
  neueste 2. Die bisherige Normalverteilung mit Standardabweichung 0 lieferte nur Einsen.
  Bei unregelmäßiger Abtastung entscheidet die reale Zeit, nicht der Sample-Index.
- Savitzky–Golay verwendet skalierte Koordinaten und QR-Zerlegung statt der expliziten
  Inversen der Normalengleichungen. Am Rand wird das Polynom des ersten bzw. letzten
  vollständigen Fensters an der passenden Randposition ausgewertet.
- Negative Polynomgrade, überlaufende Fenstergrößen und unterbestimmte Savitzky–Golay-
  Designs werden beim Konstruktoraufruf abgewiesen. Base2D benötigt mindestens ein Sample.

## Signale und unabhängige Erwartungswerte

Ein skalares Signal `s` wird auf `(X,Y,Z) = (s, 2s+3, 0.7-0.25s)` abgebildet.
So werden alle Achsen mit unterschiedlichen Offsets und Vorzeichen geprüft. Die gemeinsame
Assertion prüft Anzahl, Werte und implizit auch NaN/Infinity durch endliche Sollwerte.

| Filter | Konstante | Rampe | Sprung |
| --- | --- | --- | --- |
| Einfacher Mittelwert, Fenster 3 | Verstärkung 1 | `0, .5, 1, 2, 3` für Eingang `0,1,2,3,4` | `0,0,0,1/3,2/3,1` |
| Gewichteter Mittelwert, Fenster 3 | Verstärkung 1 | `0, 2/3, 4/3, 7/3, 10/3` | `0,0,0,1/2,5/6,1` |
| Polynomfit | Verstärkung 1 | Exakte lineare Funktion auch bei unregelmäßigen Zeiten | Grad 1: `-.2,.1,.4,.7,1` für `0,0,0,1,1` |
| Gewichteter Polynomfit | Verstärkung 1 | Exakte lineare Funktion auch bei unregelmäßigen Zeiten | Grad 0: `4/9` statt ungewichtet `1/3` für `0,0,1` bei Zeiten `0,.1,.2` |
| Savitzky–Golay | Verstärkung 1 | Rampe und quadratische Funktion einschließlich Rändern exakt | Innenmittelwerte und Randfit werden getrennt geprüft; letzter Wert beim späten Sprung ist `5/6` |
| Butterworth, 3 Hz | Verstärkung 1 | Analytische Rampenantwort bei unregelmäßigen Zeitabständen | Analytische Sprungantwort, zulässiges Überschwingen und Einschwingen auf 1 |

Die Mittelwert-Sprungsequenz ist `0,0,0,1,1,1`. Mittelwerte verwenden am Anfang nur die
vorhandenen Samples und normieren entsprechend. Größere Fenster als das Signal sind erlaubt.

Für Butterworth gilt `alpha = 2*pi*3/sqrt(2)`. Bei Anfangszustand Null sind die Referenzen:

- Rampe: `y(t) = t - (1 - exp(-alpha*t)*cos(alpha*t))/alpha`.
- Idealer Sprung: `y(t) = 1 - exp(-alpha*t)*(cos(alpha*t)+sin(alpha*t))`.

Die Implementierung interpoliert zwischen Messungen linear. Deshalb nähert der Sprungtest
seinen idealen Sprung durch eine Anstiegszeit von 10 Mikrosekunden an; die Toleranz von
`2e-4` berücksichtigt diese Modellabweichung. Batch- und Streaming-API werden jeweils
gegen die analytische Referenz geprüft, nicht nur gegeneinander. Ein am Ende irrtümlich
ungeschriebener Nullwert würde den Einschwingtest verletzen.

Polynom- und Savitzky–Golay-Fits dürfen an Sprüngen über-/unterschwingen. Sie werden deshalb
nicht pauschal auf Monotonie oder den Wertebereich des Eingangs getestet. Globale Fits und
zentrierte Savitzky–Golay-Fenster können innerhalb einer übergebenen Liste spätere Samples
nutzen; der Tracker veröffentlicht deren jüngsten Wert. Mittelwerte bleiben kausal.
Savitzky–Golay ist weiterhin für gleichmäßig abgetastete Sample-Fenster definiert; für
unregelmäßige physikalische Zeitabstände stehen die zeitbasierten Fits und Butterworth bereit.

## Erweitern und ausführen

Neue gemeinsame Verträge können über die `Filters`-Liste parametrisiert werden. Für einen
neuen Signaltest zuerst den Sollverlauf oder eine geschlossene Formel dokumentieren;
keine Produktionskoeffizienten in die Erwartungsberechnung kopieren. Keine Sleeps und kein
Zufall: Zeitstempel sind explizit, Referenzsignale deterministisch.

```sh
dotnet test test/Library/InteractionTests/InteractionTests.csproj --filter FullyQualifiedName~SignalFilterTest
dotnet test test/Library/InteractionTests/InteractionTests.csproj
```
