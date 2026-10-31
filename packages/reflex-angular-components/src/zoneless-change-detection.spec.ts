import { ChangeDetectionStrategy, Component, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../test/helpers/dom';
import { OptionCheckboxComponent } from './components/option-checkbox/option-checkbox.component';
import { PanelHeaderComponent } from './components/panel-header/panel-header.component';
import { SettingsGroupComponent } from './components/settings-group/settings-group.component';
import { ValueSelectionComponent } from './components/value-selection/value-selection.component';
import { ValueSliderComponent } from './components/value-slider/value-slider.component';
import { ValueTextComponent } from './components/value-text/value-text.component';

@Component({
  imports: [
    ValueSliderComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-value-slider [(data)]="value" (onChange)="saved = value" />
    <app-option-checkbox [(data)]="checked" />
    <app-panel-header [(data)]="active" />
    <p id="result">{{ value }} / {{ saved }} / {{ checked }} / {{ active }}</p>
  `
})
class ControlsHost {
  public value = 0;
  public saved = 0;
  public checked = false;
  public active = true;
}

describe('Zoneless component-library change detection', () => {
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

  for (const type of [
    SettingsGroupComponent,
    ValueSelectionComponent,
    ValueTextComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent,
    ValueSliderComponent
  ]) {
    it(`renders updated inputs of ${type.name}`, async () => {
      const fixture = TestBed.createComponent(
        type as typeof SettingsGroupComponent
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
  }

  it('propagates checkbox and panel events through two-way bindings', async () => {
    const fixture = TestBed.createComponent(ControlsHost);
    await fixture.whenStable();
    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'app-option-checkbox input').click();
    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'app-panel-header input').click();
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '#result').textContent
    ).toContain('true / false');
  });

  it('renders slider values and the debounced output in the parent view', async () => {
    const fixture = TestBed.createComponent(ControlsHost);
    await fixture.whenStable();
    const slider: HTMLInputElement = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'input[type="range"]');
    slider.value = '7';
    slider.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'app-value-slider input[type="text"]')
        .value
    ).toBe('7');
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '#result').textContent
    ).toContain('7 / 0');
    await new Promise((resolve) => setTimeout(resolve, 150));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '#result').textContent
    ).toContain('7 / 7');
  });
});
