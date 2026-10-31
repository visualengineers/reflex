import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './value-slider.component.test-context';

describe('ValueSliderComponent', () => {
  setupTests();

  it('should update range values', async () => {
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    const minElem = fixture.debugElement.query(
      By.css('.settings__item--valueMin')
    );
    const maxElem = fixture.debugElement.query(
      By.css('.settings__item--valueMax')
    );
    const unitElem = fixture.debugElement.query(
      By.css('.settings__item--unit')
    );
    const inputElem = fixture.debugElement.query(By.css('.custom-input'));

    const min = -100;
    const max = 125;
    const step = 12;
    const unit = 'tests';
    const data = 23;

    fixture.componentRef.setInput('min', min);
    fixture.componentRef.setInput('max', max);
    fixture.componentRef.setInput('step', step);
    fixture.componentRef.setInput('unit', unit);
    fixture.componentRef.setInput('data', data);

    fixture.detectChanges();
    await await fixture.whenStable();

    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).min)).toEqual(min);
    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).max)).toEqual(max);
    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).step)).toEqual(step);

    expect((minElem.nativeElement as HTMLInputElement).textContent).toEqual(`${min}`);
    expect((maxElem.nativeElement as HTMLInputElement).textContent).toEqual(`${max}`);
    expect((unitElem.nativeElement as HTMLInputElement).textContent).toEqual(unit);

    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).value)).toEqual(20);
    expect(parseInt((inputElem.nativeElement as HTMLInputElement).value)).toEqual(data);
  });

  it('should correctly update values when updating text input', async () => {
    const updatedValue = 5;

    const emitter = vi.spyOn(component.dataChange, 'emit');
    const onModelChange = vi.spyOn(component, 'update');
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    (inputElem.nativeElement as HTMLInputElement).value = '5';
    (inputElem.nativeElement as HTMLInputElement).dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.data).toEqual(updatedValue);
    expect((rangeElem.nativeElement as HTMLInputElement).value).toEqual(`${updatedValue}`);

    expect(onModelChange).toHaveBeenCalledTimes(1);

    expect(onModelChange).toHaveBeenCalledWith(updatedValue);
    expect(emitter).toHaveBeenCalledTimes(1);
    expect(emitter).toHaveBeenCalledWith(updatedValue);
  });
});
