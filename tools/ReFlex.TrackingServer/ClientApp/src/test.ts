// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Match the application's zoneless scheduling, including after TestBed resets.
@NgModule({ providers: [provideZonelessChangeDetection()] })
class TrackingServerTestingModule {}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  [BrowserDynamicTestingModule, TrackingServerTestingModule],
  platformBrowserDynamicTesting()
);
