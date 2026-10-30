# Recorded spatial regression scene

`three-deformations.csv` contains 480 rows of 640 float32 sensor depth values,
exported without alteration from the running framework's frame 3020. Decimal
values use 17 significant digits to preserve every transmitted value. This is
input to the Python service after ReFlex preprocessing, not original camera data.

The adjacent JSON records capture timestamp, CSV SHA-256, zero plane (1.45),
user-confirmed geometry, original filter settings and independently identified
expected locations: two pushes and one pull. Test settings (2/100) intentionally
differ from the capture's former 1D filter settings (0.1/100).

The fixture must not be regenerated from the detector under test. An intentional
replacement needs another documented framework capture, independently checked
expected positions and an updated checksum. Tests run offline at steps 1, 2 and 4.
