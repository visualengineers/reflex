import { By } from '@angular/platform-browser';
import { queryElement } from '../../../../../../test/helpers/dom';
import { component, fixture, setupTests } from './panel.component.test-context';

describe('PanelComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign the correct element name and id', () => {
    const settingsGroup = fixture.debugElement.query(
      By.css('app-panel-header')
    );
    expect(settingsGroup).toBeTruthy();

    const id = 'testId-toggle';

    const toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    const name = (toggle.nativeElement as HTMLInputElement).getAttribute('name');
    expect(name).toEqual(id);

    const type = (toggle.nativeElement as HTMLInputElement).getAttribute('type');
    expect(type).toEqual('checkbox');

    const { disabled } = toggle.nativeElement as HTMLInputElement;
    expect(disabled).toBeFalsy();
  });

  it('should set correct attributes for input and label', () => {
    const settingsGroup = fixture.debugElement.query(
      By.css('app-panel-header')
    );
    expect(settingsGroup).toBeTruthy();

    const id = 'testId-toggle';
    const labelId = 'testId-label';

    const toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    const label = settingsGroup.query(By.css(`#${labelId}`));
    expect(label).toBeTruthy();

    const name = (toggle.nativeElement as HTMLInputElement).getAttribute('name');
    expect(name).toEqual(id);

    const ariaLabel = (toggle.nativeElement as HTMLInputElement).getAttribute('aria-labelledby');
    expect(ariaLabel).toEqual(labelId);

    const ariaName = (label.nativeElement as HTMLInputElement).getAttribute('name');
    expect(ariaName).toEqual(labelId);

    const type = (toggle.nativeElement as HTMLInputElement).getAttribute('type');
    expect(type).toEqual('checkbox');

    const classToggle = (toggle.nativeElement as HTMLInputElement).getAttribute('class');
    expect(classToggle).toContain('checkbox-toggle');

    const classLabel = (label.nativeElement as HTMLInputElement).getAttribute('class');
    expect(classLabel).toContain('checkbox-toggle-label');

    const { disabled } = toggle.nativeElement as HTMLInputElement;
    expect(disabled).toBeFalsy();
  });

  it('should correctly set data binding for toggle data', async () => {
    await fixture.whenStable();
    const toggle: HTMLInputElement
      = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#testId-toggle');
    const message: HTMLElement
      = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#toggleMessage');
    expect(toggle.checked).toBe(true);
    expect(message.classList).toContain('bg-active');

    component.toggleHeaderActive = false;
    // This assignment simulates a parent update outside an Angular event handler.
    fixture.changeDetectorRef.markForCheck();
    await await fixture.whenStable();

    expect(toggle.checked).toBe(false);
    expect(message.classList).toContain('bg-inactive');
  });
});
