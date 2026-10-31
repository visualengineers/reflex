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

## Running end-to-end tests

Run `ng e2e TrackingServer` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
