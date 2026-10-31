import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './panel-header.component.test-context';

describe('PanelHeaderComponent', () => {
  setupTests();

  it('should assign default checked state', () => {
    const defaultState = false;

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect((inputElem.nativeElement as HTMLInputElement).checked).toEqual(defaultState);
  });

  it('should correctly set checked state', () => {
    const emitter = vi.spyOn(component.dataChange, 'emit');
    const onModelChange = vi.spyOn(component, 'update');

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
