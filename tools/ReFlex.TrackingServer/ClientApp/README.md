# ReFlex.TrackingServer

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.2.

## Development server

Run `ng serve TrackingServer` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name --project=TrackingServer` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build TrackingServer` to build the project. The build artifacts will be stored in the `dist/` directory.

From the repository root, run `npm run build:server`. A running .NET backend is not required
for this build. All TrackingServer routes use client-side rendering because their API requests,
SignalR connections and polling need a live backend at runtime. The build produces the static
browser application in `dist/browser`; it does not prerender the dashboard pages.
When serving the application, keep the .NET fallback to `index.html` for direct navigation to routes.

## Running unit tests

Run `ng test TrackingServer` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Zoneless change detection

TrackingServer explicitly uses `provideZonelessChangeDetection()` in both the app
and its test environment. Its polyfills do not load `zone.js` or `zone.js/testing`.
The other Angular applications and the shared library tests also use zoneless scheduling;
see the repository README for the audit and verification commands.

Imperative RxJS subscriptions that write template state use `markViewForCheck()`
with the component's `ChangeDetectorRef`. This schedules Angular's normal check
after the callback has updated its fields, including mutations of nested settings.
It does not call `detectChanges()` or introduce a global polling/change-detection loop.

| Boundary | Components / handling |
| --- | --- |
| HTTP and SignalR responses | Tracking, Settings, Processing, Calibration, Network, TUIO, package details and Recording notify their view on subscription emissions. |
| Polling | Log, capture controls and limitation-filter polling notify the view when results arrive. Capture state also notifies before the subsequent sample-index request completes. |
| Chained streams | Calibration notifies on processing status even if no interaction has arrived; Recording owns and unsubscribes its recording-state subscription. |
| Imperative child updates | `InteractionsComponent.updateInteractions()` and `InteractionsVisualizationComponent.updateCalibratedInteractions()` notify their own views when called through `ViewChild`. |
| Geometry and live frames | Measurement/interaction viewport sizing, history SVGs, WebSocket image frames and point-cloud counters notify Angular. Shader loads, scene-only changes and the WebGL animation loop do not schedule Angular checks per render frame. |
| Existing Angular notifications | Home uses `AsyncPipe`; template/host events and input bindings continue to schedule change detection themselves. |

[`zoneless-change-detection.spec.ts`](src/app/zoneless-change-detection.spec.ts)
exercises these boundaries using the real templates, controlled asynchronous
responses and `fixture.whenStable()`. It deliberately avoids manual
`detectChanges()`/`markForCheck()` calls and verifies that Zone.js is absent.
It also checks error-state rendering and subscription cleanup. GPU rendering is
excluded from the geometry/scheduling unit tests; they use the supported no-WebGL
fallback. The existing browser/Electron smoke test checks application startup.

Run the complete suite with `npm run test:server` from the repository root.

## Running end-to-end tests

Run `ng e2e TrackingServer` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
