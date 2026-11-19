# Review of interaction smoothing and contact tracking

Reviewed on 2026-11-19. Branch: `fix/interaction-smoothing-behaviour`.

- Head: `ccc85773b031b7cc1fae1bc561cdadbef3c471bc`.
- Base and merge base: `139a1b4ee88f0d57306dd10035f12a903bedc59c` (`main`, also matching local `origin/main`).
- Scope: `git diff main...HEAD`, 164 changed files. PR #3512 metadata/comments could not be retrieved; this review uses repository contents.
- The initial working tree was clean. Review edits are uncommitted and limited to documentation, comments and presentation/style cleanup. Functional changes below are proposals.

## Findings requiring functional changes

### P1: Apply live tracker configuration under the tracking lock

Locations: `InteractionObserverBase` configuration setters and `_trackingSync`; `InteractionSmoothingBehaviour.NumFramesHistory`, `NumFramesSmoothing` and `UpdateFilterType`.

`Update()` and `AdvanceTime()` protect tracking with `_trackingSync`, but observer setters forward directly to the same smoothing instance without that lock. HTTP settings requests reach these setters through `SettingsService.Update`. Newly stateful setters enumerate `_tracks`, clear it when history becomes zero, and mutate `_interactionFrames` while the timer thread can be matching or publishing.

For example, setting history to zero between taking the track snapshot in `Update()` and calling `SmoothInteraction(id)` removes the dictionary entry that `SmoothInteraction` indexes. Changing the smoothing window can also enumerate `_tracks.Values` concurrently with additions. Consequences include a failed observation or request and partially applied configuration. The manager's `_updateGate` only serializes updates, not settings writes.

This is a static concurrency finding; the existing tests exercise sequential configuration changes, not this interleaving.

**Implementation proposal:** Introduce a validated tracking configuration value and an observer-level `ApplyTrackingSettings` operation. Apply the complete value under the same `_trackingSync` used for frame processing, at one frame boundary. Route settings application through this operation; coordinate observer replacement separately at the manager boundary. Validate before mutating live state. Do not hold a synchronous monitor across remote awaits. As an incremental fix, protect every state-mutating smoothing setter with the same observer lock, while retaining a follow-up for atomic multi-property updates.

**Required tests:** Use barriers to pause a frame at the tracking stage, issue a settings change on another task, and verify that it applies only after the frame finishes. Cover history zero/nonzero, smoothing-window changes, filter changes and prediction settings. Assert no collection exceptions, internally consistent diagnostics and intentional ID-reset behavior.

### P2: Prediction saves overwrite the configuration before its backup is written

Location: `tools/ReFlex.TrackingServer/Controllers/SettingsController.cs`, `SetPrediction`, lines 116–117.

`SetPrediction` assigns `_configManager.Settings.PredictionSettings = value` before calling `ConfigurationManager.Update`. That method first serializes the current `Settings` to the backup, so the backup already contains the new prediction settings. The new assignment endpoints avoid this by cloning the configuration first.

**Reproduced:** Starting with a forecast horizon of `0.05`, call `SetPrediction` with `0.25`, then `Restore`. The effective horizon remains `0.25`; the expected previous value is `0.05`. A temporary NUnit probe using the existing `AssignmentApiTest` fixture failed with exactly these values. The probe was removed after the review.

**Implementation proposal:** Generalize the copy-before-update helper used by assignment settings. Validate the incoming prediction model, clone the current configuration, replace prediction settings in the clone, persist it, and apply the configuration through the common configuration-update path. Avoid mutating the original object before the backup is created.

**Required tests:** Add a prediction-specific controller integration fixture covering save → restore, reset, startup reload, full import, invalid requests without mutation, and persistence failures if the configuration service exposes them. Verify both live manager settings and the backup contents.

### P2: One calibration error permanently stops the prediction overlay

Location: `tools/ReFlex.TrackingServer/ClientApp/src/app/processing/interactions-visualization/interactions-visualization.component.ts`, prediction subscription in `ngOnChanges`, lines 110–125.

`calibratePredictions` is inside `exhaustMap`, but failures are handled only by the terminal subscription error handler. One failed HTTP calibration request, or an unexpected calibration response, closes the entire velocity subscription. Later healthy velocity frames are ignored. Subscription creation is only revisited when `isProcessing` or `showPrediction` changes, so recovery requires toggling the view/processing or navigating away.

This follows directly from the subscription/error path; the current tests verify the error message but do not establish automatic recovery on the next valid frame.

**Implementation proposal:** Catch per-frame calibration errors inside the `exhaustMap` inner observable. Clear the affected display and set the status message, then return an empty result/complete the inner request while keeping the velocity subscription alive. Clear the message on the next successful calibration. Treat transport failures separately with an explicit reconnection policy. Keep disposal on hiding/stopping the view.

**Required test:** Emit frame A whose calibration fails, then frame B whose calibration succeeds without changing inputs. Verify frame B is displayed, the error is cleared, and only one upstream subscription remains. Also cover disposal while calibration is pending.

## Evaluation against the requested criteria

| Area | Assessment and action |
| --- | --- |
| Coding style | Frontend ESLint passes. Existing C# files use mixed indentation and brace styles; avoid a branch-wide reformat that obscures this behavioral change. Cleaned import ordering and arithmetic formatting in the tracker, expanded new compact SCSS blocks, removed inline legend color declarations into the component stylesheet, and removed a trailing blank line in test data. |
| Software design | Separate live track state, copied interaction values, timestamped observations, one-to-one assignment and permanent expiry are sound improvements. Snapshot ownership and reuse are documented. Live configuration synchronization and persistence ordering need correction before merging. The tracker now combines lifecycle, matching, filtering and motion estimation; extraction should preserve the regression suite. |
| Source comments | Useful explanations cover monotonic clocks, input ownership, normalized assignment costs and numerical conditioning. Corrected misleading frame semantics on `InteractionVelocity` and documented that the legacy `Squared2DDistance` helper actually returns Manhattan distance. The public observer contract now states the same metric. |
| Tests | Broad coverage exists for filters, timing, matching, consolidation, sensor snapshots, configuration defaults and Angular views. Existing suites pass, but miss concurrent live settings, prediction restore and recovery after a calibration error. Passing tests therefore do not resolve the findings above. |
| Documentation | REST documentation existed, but configuration/UI documentation still described frame-count retention and an older matching algorithm. Updated configuration migration/defaults, confidence timing, matching/consolidation metrics, snapshot behavior, prediction controls, units, SignalR diagnostics and pipeline behavior. |
| File/folder structure | Production code follows the established Common/Filtering/Interactivity/Implementation split. New UI components live beside existing processing components; server integration tests are in the solution. The replay tool is appropriately under `test/touchid-analysis`; results are under `test/analysis/touchid-3512`. No further small relocation was justified. |
| UI consistency | Existing shared checkbox/slider components are reused in most new controls. Prediction table units distinguish sensor values from calibrated display positions; symbols and dashed lines supplement color. Legend colors now live in SCSS without changing their values. Error recovery and effective sample-count feedback need improvement. No live sensor/browser visual inspection was performed. |

## Additional concrete follow-ups

### Distinguish requested and effective prediction sample counts

A second temporary controller probe established that requesting `100` samples with history capacity `3` returns `100`, while `InteractionManager.NumFramesForPrediction` is `3`. This is consistent with the current documented clamping, so it is not listed as an independent correctness defect. However, the saved-success message and slider do not show the actual limit.

Either expose requested and effective counts separately, or validate/clamp before saving and return the effective value. If preserving the requested count is intentional so it can take effect after history grows, retain it and show “100 requested, 3 effective.” Add a test for history shrinking and growing, including the acceleration requirement of three actual measurements.

### Reduce responsibilities without changing the algorithms

After functional fixes, extract motion fitting/forecast creation and the two assignment strategies behind small internal types. Keep lifetime and confidence transitions in the tracker. Use the current timed regression fixtures to assert identical outputs before/after extraction. Avoid introducing a service abstraction for every data object or changing folder structure merely for symmetry.

The duplicated Butterworth transition equations in `ProcessSample` and `Smooth` can likewise share a private scalar transition helper, with the existing filter tests verifying numerical equivalence.

### Finish public-contract and artifact housekeeping separately

`Interaction.TrackingState` is new in C#, but absent from the shared TypeScript `Interaction` model. Add the corresponding enum/property with a deliberate compatibility policy for older servers, and document the removal of the old frame-count setter for custom observer/manager implementations. JSON configuration migration alone does not provide source compatibility for those interfaces.

The branch also includes generated `tsconfig.tsbuildinfo` changes and large historical replay/benchmark outputs. Keep evidence reproducible, but consider storing future generated outputs as CI artifacts with a small checked-in manifest and summary. Do not rewrite historical data as part of this review. A whole-branch `git diff --check` reports CRLF CSV rows and whitespace in benchmark markdown; the working-tree review edits themselves pass `git diff --check`.

## Verification

Executed on the ARM64 development host:

| Check | Result |
| --- | --- |
| `dotnet test test/Library/InteractionTests/InteractionTests.csproj --no-restore -m:1 -p:UseSharedCompilation=false` | 289 passed |
| `dotnet test test/Library/Common.Test/Common.Test.csproj --no-restore -m:1 -p:UseSharedCompilation=false` | 94 passed |
| `dotnet test test/Server/SettingsTests/SettingsTests.csproj --no-restore -m:1 -p:Platform=ARM64 -p:UseSharedCompilation=false` | 7 passed |
| `npm run test:server` | 184 passed in 26 Chromium test files; repeated after style edits |
| `npm run lint:server` | Passed; repeated after style edits |
| `git diff --check` | Passed for review edits |
| Temporary prediction restore probe | Failed as expected: expected `0.05`, actual `0.25` |
| Temporary sample-count contract probe | Expected effective `3`, response `100`; documented as a UI/contract clarification |

The initial sandboxed test attempts were prevented from opening local IPC/server sockets; reruns with the required local permissions completed. An initial server-test run without the documented ARM64 platform failed to load the platform-specific server assembly; the README-prescribed ARM64 run passed. Existing compiler/package warnings remain. Full-solution tests, replay benchmarks, a real sensor run, and visual end-to-end inspection were not executed.
