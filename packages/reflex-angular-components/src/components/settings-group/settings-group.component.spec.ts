import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SettingsGroupComponent } from './settings-group.component';

describe('Zoneless change detection: runs fixtures without Zone.js', () => {
  it('runs fixtures without Zone.js', async () => {
    expect(
      Reflect.get(globalThis, 'Zone')
    ).toBeUndefined();
    const fixture = TestBed.createComponent(SettingsGroupComponent);
    await fixture.whenStable();
    expect(
      fixture.debugElement.injector
        .get(NgZone)
        .run(() => NgZone.isInAngularZone())
    ).toBe(false);
  });
});

describe('Zoneless change detection: renders updated inputs of SettingsGroupComponent', () => {
  it('renders updated inputs of SettingsGroupComponent', async () => {
    const fixture = TestBed.createComponent(
      SettingsGroupComponent
    );
    await fixture.whenStable();
    fixture.componentRef.setInput(
      'elementTitle',
      'Asynchronously updated title'
    );
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'Asynchronously updated title'
    );
  });
});
