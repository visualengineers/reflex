# Emulator

Development tool to emulate depth camera input for testing depth image analysis, gesture detection etc.
Emulator app registers as depth camera at ReFlex framework sending periodic "depth frames" to the framework. 

This project was generated wih [Angular CLI](https://github.com/angular/angula-cli) version 9.0.6.

## Setup

Rund `npm install`ton install dependencies.

## Development server

Run `npm start` from this package directory for a dev server. Navigate to `http://localhost:4300/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build reflex-emulator` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--configuration production` flag for a production build.

## Running unit tests

Run `ng test reflex-emulator` to execute the unit tests with Vitest in headless Chromium. Install the browser once with `npx playwright install chromium` from the repository root.

## Running end-to-end tests

Run `ng e2e reflex-emulator` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

