import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './option-checkbox.component.test-context';

describe('OptionCheckboxComponent', () => {
  setupTests();

  it('should correctly set disabled state', () => {
    const newState = true;
    fixture.componentRef.setInput('disabled', newState);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).disabled).toEqual(newState);
  });

  it('should assign default checked state', () => {
    const defaultState = false;

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).checked).toEqual(defaultState);
  });

  it('should correctly set checked state', () => {
    const emitter = vi.spyOn(component.dataChange, 'emit');
    const onModelChange = vi.spyOn(component, 'onModelChange');

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    (inputElem.nativeElement as HTMLInputElement).click();

    fixture.detectChanges();

    expect(component.data).toEqual(true);
    expect((inputElem.nativeElement as HTMLInputElement).checked).toBeTruthy();

    expect(onModelChange).toHaveBeenCalledTimes(1);

    expect(onModelChange).toHaveBeenCalledWith(true);
    expect(emitter).toHaveBeenCalledTimes(1);
    expect(emitter).toHaveBeenCalledWith(true);
  });
});
