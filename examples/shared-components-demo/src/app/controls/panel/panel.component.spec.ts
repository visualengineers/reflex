import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../../test/helpers/dom';
import { PanelComponent } from './panel.component';

describe('Zoneless change detection: updates the projected panel notification after a toggle and clears it asynchronously', () => {
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
