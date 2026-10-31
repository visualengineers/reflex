import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Keep scheduling identical to the application, including after TestBed resets.
@NgModule({ providers: [provideZonelessChangeDetection()] })
class ZonelessTestingModule {}

getTestBed().initTestEnvironment(
  [BrowserDynamicTestingModule, ZonelessTestingModule],
  platformBrowserDynamicTesting()
);
