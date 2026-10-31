// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Match the application's Zone.js change detection, including after TestBed resets.
@NgModule({ providers: [provideZoneChangeDetection()] })
class TrackingServerTestingModule {}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  [BrowserDynamicTestingModule, TrackingServerTestingModule],
  platformBrowserDynamicTesting()
);
