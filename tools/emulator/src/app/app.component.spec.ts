import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { queryElement } from '../../../../test/helpers/dom';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { setupTests as setupZonelessTests } from './test-utils/zoneless-change-detection.test-context';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'ReFlex | Emulator'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ReFlex | Emulator');
  });

  it('should have content', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLInputElement;
    expect(queryElement(compiled, '.content')).toBeTruthy();
  });
});

describe('Zoneless change detection: initializes the application without Zone.js', () => {
  setupZonelessTests();

  it('initializes the application without Zone.js', async () => {
    expect(
      Reflect.get(globalThis, 'Zone')
    ).toBeUndefined();
    const app = await createApplication(appConfig);
    try {
      expect(app.injector.get(NgZone).run(() => NgZone.isInAngularZone())).toBe(
        false
      );
    } finally {
      app.destroy();
    }
  });
});
