import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './value-slider.component.test-context';

describe('ValueSliderComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign default id', () => {
    const defaultId = 'customSlider';

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect((rangeElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${defaultId}-range`
    );
    expect((rangeElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${defaultId}-range`
    );

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${defaultId}-input`
    );
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${defaultId}-input`
    );

    const labelElem = fixture.debugElement.query(
      By.css('.settings__item--label')
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${defaultId}-label`
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${defaultId}-label`
    );
  });

  it('should set id correctly', () => {
    const testId = 'Value Slider TestId';
    fixture.componentRef.setInput('elementId', testId);

    fixture.detectChanges();

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect((rangeElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${testId}-range`
    );
    expect((rangeElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${testId}-range`
    );

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${testId}-input`
    );
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${testId}-input`
    );

    const labelElem = fixture.debugElement.query(
      By.css('.settings__item--label')
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(
      `${testId}-label`
    );
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(
      `${testId}-label`
    );
  });
});
