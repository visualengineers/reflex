import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ControlsHost } from '../../test-utils/controls-host';
import { ValueSliderComponent } from './value-slider.component';

describe('Zoneless change detection: renders updated inputs of ValueSliderComponent', () => {
  it('renders updated inputs of ValueSliderComponent', async () => {
    const fixture = TestBed.createComponent(
      ValueSliderComponent
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

describe('Zoneless change detection: renders slider values and the debounced output in the parent view', () => {
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
