# Gestenrecorder

Redesign and reimplementation of emulator tool for recording and replaying complex gestures. Aimed to facilitate app development and testing for Elastic Displays. Part of lecture `Projektseminar Summer 2024` @ University of Applied Sciences, Dresden.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.2.2.


## Project initialization

* initialize / install packages in parent workspace
* need `packages/reflex-angular-components` and `packages/reflex-shared-types`, so these should be build beforehand
* use run script ```npm run start:gestenrecorder```

## main components

* TouchAreaComponent
* TimelineComponent
* TrackComponent
* OptionsComponents (RecorderOptionsComponent, GestureOptionsComponent, SavingOptionsComponent)
* Services (GestureDataServices, GestureReplayService, ConnectionService, ConfigurationService)

## Contributors

* Joel Giese
* Jonas Lorenz
* Tim Müller
