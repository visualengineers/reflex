import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './option-checkbox.component.test-context';

describe('OptionCheckboxComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign default id', () => {
    const defaultId = 'custom-checkbox';

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${defaultId}-checkbox`
    );
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${defaultId}-checkbox`
    );

    const labelElem = fixture.debugElement.query(
      By.css('.checkbox-toggle-label')
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${defaultId}-label`
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${defaultId}-label`
    );
  });

  it('should set id correctly', () => {
    const testId = 'OptionCheckBoxTestId';
    fixture.componentRef.setInput('elementId', testId);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${testId}-checkbox`
    );
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${testId}-checkbox`
    );

    const labelElem = fixture.debugElement.query(
      By.css('.checkbox-toggle-label')
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${testId}-label`
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${testId}-label`
    );
  });

  it('should assign default title', () => {
    const defaultTitle = 'Custom Value';

    const inputElem = fixture.debugElement.query(
      By.css('.settings__item--label')
    );
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${defaultTitle}`);
  });

  it('should set title correctly', () => {
    const testTitle = 'OptionCheckBox - TestTitle';
    fixture.componentRef.setInput('elementTitle', testTitle);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(
      By.css('.settings__item--label')
    );
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${testTitle}`);
  });

  it('should assign default disabled state', () => {
    const defaultState = false;

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).disabled).toEqual(defaultState);
  });
});
