import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './value-slider.component.test-context';

describe('ValueSliderComponent', () => {
  setupTests();

  it('should correctly update values when updating range input', async () => {
    const updatedValue = 8;

    const emitter = vi.spyOn(component.dataChange, 'emit');
    const onModelChange = vi.spyOn(component, 'update');
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    (rangeElem.nativeElement as HTMLInputElement).value = String(updatedValue);
    (rangeElem.nativeElement as HTMLInputElement).dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await await fixture.whenStable();

    expect(component.data).toEqual(8);
    expect((inputElem.nativeElement as HTMLInputElement).value).toEqual(`${updatedValue}`);

    expect(onModelChange).toHaveBeenCalledTimes(1);

    expect(onModelChange).toHaveBeenCalledWith(updatedValue);
    expect(emitter).toHaveBeenCalledTimes(1);
    expect(emitter).toHaveBeenCalledWith(updatedValue);
  });
});
