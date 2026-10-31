import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { queryElement } from '../../../../test/helpers/dom';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { setupTests as setupZonelessTests } from './test-utils/zoneless-change-detection.test-context';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'gestenrecorder' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('gestenrecorder');
  });

  it('should render gesture controls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.recorder__header > .settings__button-group > button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('Build');
    expect(queryElement<HTMLInputElement>(compiled, '#first-toggle-checkbox')).toBeTruthy();
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
