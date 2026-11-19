# Tracking settings integration tests

These tests call the production settings controller, configuration manager and settings service
with a real interaction manager. Configuration files and backups live in isolated temporary
directories; property-only substitutes remove sensor, network and filter-mask dependencies.

Coverage includes legacy defaults, dedicated GET/POST operations, immediate runtime application,
file persistence, startup reload, full-settings save/import, backup restore, reset and rejection
of invalid costs without changing memory or disk. Prediction regressions additionally verify
copy-before-save backups, restoration of all prediction fields, reset, persisted values and
invalid requests leaving runtime settings, saved configuration and backup unchanged.

Run on an ARM64 host from the repository root:

```sh
dotnet test test/Server/SettingsTests/SettingsTests.csproj -p:Platform=ARM64
```

Use `-p:Platform=x64` on an x64 host. This matches the referenced TrackingServer assembly's platform.
The project is included under the test/Server solution folder.
