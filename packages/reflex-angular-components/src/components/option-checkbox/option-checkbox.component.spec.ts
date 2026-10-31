import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ControlsHost } from '../../test-utils/controls-host';
import { OptionCheckboxComponent } from './option-checkbox.component';

describe('Zoneless change detection: renders updated inputs of OptionCheckboxComponent', () => {
  it('renders updated inputs of OptionCheckboxComponent', async () => {
    const fixture = TestBed.createComponent(
      OptionCheckboxComponent
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

describe('Zoneless change detection: propagates checkbox and panel events through two-way bindings', () => {
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
});
