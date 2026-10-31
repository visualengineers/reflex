import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { IntroductionComponent } from './introduction/introduction.component';
import { PanelComponent } from './controls/panel/panel.component';
import { SelectComponent } from './controls/select/select.component';

describe('Zoneless change detection', () => {
  it('initializes the application without Zone.js', async () => {
    expect((globalThis as {Zone?: unknown}).Zone).toBeUndefined();
    const app = await createApplication(appConfig);
    try { expect(app.injector.get(NgZone).run(() => NgZone.isInAngularZone())).toBeFalse(); }
    finally { app.destroy(); }
  });

  it('renders delayed documentation HTTP responses through AsyncPipe', async () => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    const fixture = TestBed.createComponent(IntroductionComponent);
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('assets/angular_json.txt').flush('angular configuration response');
    http.expectOne('assets/package_json.txt').flush('package configuration response');
    http.expectOne('assets/component_imports.txt').flush('component imports response');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('angular configuration response');
    expect(fixture.nativeElement.textContent).toContain('package configuration response');
    expect(fixture.nativeElement.textContent).toContain('component imports response');
    http.verify();
  });

  it('clears the saved-filter notification when its timer expires', async () => {
    const fixture = TestBed.createComponent(SelectComponent);
    await fixture.whenStable();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('savedFilter: Moving Average');
    await new Promise(resolve => setTimeout(resolve, 2100));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.content__header p').textContent).toBe('');
  });

  it('updates the projected panel notification after a toggle and clears it asynchronously', async () => {
    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('app-panel-header input').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#toggleMessage').textContent).toContain('inactive');
    expect(fixture.nativeElement.querySelector('app-panel-header').textContent).toContain('changed (x1)');
    await new Promise(resolve => setTimeout(resolve, 2100));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-panel-header').textContent).not.toContain('changed');
  });
});
