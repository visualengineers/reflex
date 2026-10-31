import { Component, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ValueSliderComponent } from './components/value-slider/value-slider.component';
import { OptionCheckboxComponent } from './components/option-checkbox/option-checkbox.component';
import { PanelHeaderComponent } from './components/panel-header/panel-header.component';
import { SettingsGroupComponent } from './components/settings-group/settings-group.component';
import { ValueSelectionComponent } from './components/value-selection/value-selection.component';
import { ValueTextComponent } from './components/value-text/value-text.component';

@Component({
  imports: [ValueSliderComponent, OptionCheckboxComponent, PanelHeaderComponent],
  template: `
    <app-value-slider [(data)]="value" (onChange)="saved = value" />
    <app-option-checkbox [(data)]="checked" />
    <app-panel-header [(data)]="active" />
    <p id="result">{{value}} / {{saved}} / {{checked}} / {{active}}</p>
  `
})
class ControlsHost {
  value = 0;
  saved = 0;
  checked = false;
  active = true;
}

describe('Zoneless component-library change detection', () => {
  it('runs fixtures without Zone.js', async () => {
    expect((globalThis as {Zone?: unknown}).Zone).toBeUndefined();
    const fixture = TestBed.createComponent(SettingsGroupComponent);
    await fixture.whenStable();
    expect(fixture.debugElement.injector.get(NgZone).run(() => NgZone.isInAngularZone())).toBeFalse();
  });

  for (const type of [SettingsGroupComponent, ValueSelectionComponent, ValueTextComponent, OptionCheckboxComponent, PanelHeaderComponent, ValueSliderComponent]) {
    it(`renders updated inputs of ${type.name}`, async () => {
      const fixture = TestBed.createComponent(type as typeof SettingsGroupComponent);
      await fixture.whenStable();
      fixture.componentRef.setInput('elementTitle', 'Asynchronously updated title');
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('Asynchronously updated title');
    });
  }

  it('propagates checkbox and panel events through two-way bindings', async () => {
    const fixture = TestBed.createComponent(ControlsHost);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('app-option-checkbox input').click();
    fixture.nativeElement.querySelector('app-panel-header input').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#result').textContent).toContain('true / false');
  });

  it('renders slider values and the debounced output in the parent view', async () => {
    const fixture = TestBed.createComponent(ControlsHost);
    await fixture.whenStable();
    const slider: HTMLInputElement = fixture.nativeElement.querySelector('input[type="range"]');
    slider.value = '7';
    slider.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-value-slider input[type="text"]').value).toBe('7');
    expect(fixture.nativeElement.querySelector('#result').textContent).toContain('7 / 0');
    await new Promise(resolve => setTimeout(resolve, 150));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#result').textContent).toContain('7 / 7');
  });
});
