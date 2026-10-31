import { queryElement } from '../../../../../../test/helpers/dom';
import { component, fixture, setupTests } from './panel.component.test-context';

describe('PanelComponent', () => {
  setupTests();

  it('should correctly set data binding for disabled state', async () => {
    await fixture.whenStable();
    const toggle: HTMLInputElement
      = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#testId-toggle');
    expect(toggle.disabled).toBe(false);

    component.canToggleHeader = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(toggle.disabled).toBe(true);

    component.canToggleHeader = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(toggle.disabled).toBe(false);
  });

  it('should correctly update bound data when interacting', async () => {
    await fixture.whenStable();
    const toggle: HTMLInputElement
      = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#testId-toggle');
    const message: HTMLElement
      = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#toggleMessage');

    toggle.click();
    await fixture.whenStable();
    expect(component.toggleHeaderActive).toBe(false);
    expect(toggle.checked).toBe(false);
    expect(message.classList).toContain('bg-inactive');

    toggle.click();
    await fixture.whenStable();
    expect(component.toggleHeaderActive).toBe(true);
    expect(toggle.checked).toBe(true);
    expect(message.classList).toContain('bg-active');
  });
});
