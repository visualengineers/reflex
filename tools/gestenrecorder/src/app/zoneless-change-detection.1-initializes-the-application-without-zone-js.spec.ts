import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { queryElement } from '../../../../test/helpers/dom';
import { appConfig } from './app.config';
import { DropdownComponent } from './dropdown/dropdown.component';
import { GestureoptionsComponent } from './gestureoptions/gestureoptions.component';
import { RecorderoptionsComponent } from './recorderoptions/recorderoptions.component';
import { SavingoptionsComponent } from './savingoptions/savingoptions.component';
import { ConfigurationService } from './service/configuration.service';
import { fileNames, setupTests } from './zoneless-change-detection.test-context';

describe('Zoneless change detection', () => {
  setupTests();

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

  it('closes an opened dropdown through the document HostListener', async () => {
    const fixture = TestBed.createComponent(DropdownComponent);
    await fixture.whenStable();
    queryElement((fixture.nativeElement as HTMLInputElement), '.dropdown_button').click();
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), 'app-savingoptions')
    ).not.toBeNull();
    document.body.click();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelector('app-savingoptions')).toBeNull();
  });

  it('renders touch-count changes received by the recorder options', async () => {
    const fixture = TestBed.createComponent(RecorderoptionsComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setAmoutTouchPoints(17);
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#max-amountTouchPoints').value
    ).toBe('17');
  });

  it('renders layer changes received by the gesture options', async () => {
    const fixture = TestBed.createComponent(GestureoptionsComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setLayers({
      up: 12,
      down: 7,
      colorUp: '#123456',
      colorDown: '#654321'
    });
    await fixture.whenStable();
    expect(queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#layersUp').value).toBe('12');
  });

  it('renders asynchronously loaded gesture file names', async () => {
    const fixture = TestBed.createComponent(SavingoptionsComponent);
    await fixture.whenStable();
    fileNames.next(['new-gesture.json', 'another-gesture.json']);
    await fixture.whenStable();
    const options = (fixture.nativeElement as HTMLInputElement).querySelectorAll(
      '#gestureFileNames option'
    );
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('new-gesture.json');
    fixture.destroy();
    expect(fileNames.observed).toBe(false);
  });
});
