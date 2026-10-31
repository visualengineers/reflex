import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './panel-header.component.test-context';

describe('PanelHeaderComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign default id', () => {
    const defaultId = 'custom-header';

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${defaultId}-toggle`
    );
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${defaultId}-toggle`
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
    const testId = 'PanelHeaderTestId';
    fixture.componentRef.setInput('elementId', testId);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${testId}-toggle`
    );
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${testId}-toggle`
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
    const defaultTitle = 'Custom Title';

    const inputElem = fixture.debugElement.query(By.css('.heading-secondary'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${defaultTitle}`);
  });

  it('should set title correctly', () => {
    const testTitle = 'PanelHeaderComponent - TestTitle';
    fixture.componentRef.setInput('elementTitle', testTitle);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.heading-secondary'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${testTitle}`);
  });

  it('should assign default disabled state', () => {
    const defaultState = false;

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).disabled).toEqual(defaultState);
  });

  it('should correctly set disabled state', () => {
    const newState = true;
    fixture.componentRef.setInput('disabled', newState);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).disabled).toEqual(newState);
  });
});
