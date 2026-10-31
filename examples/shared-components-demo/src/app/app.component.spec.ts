import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
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

  it(`should have the ''ReFlex Shared Components Demo'' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ReFlex Shared Components Demo');
  });

});

describe('Zoneless change detection: initializes the application without Zone.js', () => {
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
