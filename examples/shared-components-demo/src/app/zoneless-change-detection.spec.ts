import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { queryElement } from '../../../../test/helpers/dom';
import { appConfig } from './app.config';
import { PanelComponent } from './controls/panel/panel.component';
import { SelectComponent } from './controls/select/select.component';
import { IntroductionComponent } from './introduction/introduction.component';

describe('Zoneless change detection', () => {
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

  it('renders delayed documentation HTTP responses through AsyncPipe', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(IntroductionComponent);
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('assets/angular_json.txt')
      .flush('angular configuration response');
    http
      .expectOne('assets/package_json.txt')
      .flush('package configuration response');
    http
      .expectOne('assets/component_imports.txt')
      .flush('component imports response');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'angular configuration response'
    );
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'package configuration response'
    );
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'component imports response'
    );
    http.verify();
  });

  it('clears the saved-filter notification when its timer expires', async () => {
    const fixture = TestBed.createComponent(SelectComponent);
    await fixture.whenStable();
    const select: HTMLSelectElement
      = queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), 'select');
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'savedFilter: Moving Average'
    );
    await new Promise((resolve) => setTimeout(resolve, 2100));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.content__header p').textContent
    ).toBe('');
  });

  it('updates the projected panel notification after a toggle and clears it asynchronously', async () => {
    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'app-panel-header input').click();
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#toggleMessage').textContent
    ).toContain('inactive');
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), 'app-panel-header').textContent
    ).toContain('changed (x1)');
    await new Promise((resolve) => setTimeout(resolve, 2100));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), 'app-panel-header').textContent
    ).not.toContain('changed');
  });
});
