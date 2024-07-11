import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueSliderComponent } from './value-slider.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('ValueSliderComponent', () => {
  let component: ValueSliderComponent;
  let fixture: ComponentFixture<ValueSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ValueSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it ('should assign default id', () => {
    const defaultId = 'customSlider';

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect(rangeElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-range`);
    expect(rangeElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-range`)

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-input`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-input`);

    const labelElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-label`);
  });

  it ('should set id correctly', () => {
    const testId = 'Value Slider TestId';
    component.elementId = testId;

    fixture.detectChanges();

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect(rangeElem.nativeElement.getAttribute('id')).toEqual(`${testId}-range`);
    expect(rangeElem.nativeElement.getAttribute('name')).toEqual(`${testId}-range`)

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${testId}-input`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${testId}-input`);

    const labelElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${testId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${testId}-label`);
  });

  it ('should assign default title', () => {
    const defaultTitle = 'Custom Value';

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect(rangeElem.nativeElement.getAttribute('title')).toContain(`${defaultTitle}`);

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect(inputElem.nativeElement.getAttribute('title')).toContain(`${defaultTitle}`);

    const labelElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(labelElem.nativeElement.textContent).toContain(`${defaultTitle}`);
  });

  it ('should set title correctly', () => {
    const testTitle = 'ValueSlider - TestTitle';
    component.elementTitle = testTitle;

    fixture.detectChanges();

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect(rangeElem.nativeElement.getAttribute('title')).toContain(`${testTitle}`);

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect(inputElem.nativeElement.getAttribute('title')).toContain(`${testTitle}`);

    const labelElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(labelElem.nativeElement.textContent).toContain(`${testTitle}`);
  });

  it ('should assign default range values', async () => {
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    const minElem = fixture.debugElement.query(By.css('.settings__item--valueMin'));
    const maxElem = fixture.debugElement.query(By.css('.settings__item--valueMax'));
    const unitElem = fixture.debugElement.query(By.css('.settings__item--unit'));
    const inputElem = fixture.debugElement.query(By.css('.custom-input'));

    await fixture.whenStable();

    expect(parseInt(rangeElem.nativeElement.min)).toEqual(0);
    expect(parseInt(rangeElem.nativeElement.max)).toEqual(10);
    expect(parseInt(rangeElem.nativeElement.step)).toEqual(1);
    expect(parseInt(rangeElem.nativeElement.value)).toEqual(0);
    expect(parseInt(inputElem.nativeElement.value)).toEqual(0);


    expect(minElem.nativeElement.textContent).toEqual(`${0}`);
    expect(maxElem.nativeElement.textContent).toEqual(`${10}`);
    expect(unitElem.nativeElement.textContent).toEqual(``);
  });

  it ('should update range values', async () => {
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    const minElem = fixture.debugElement.query(By.css('.settings__item--valueMin'));
    const maxElem = fixture.debugElement.query(By.css('.settings__item--valueMax'));
    const unitElem = fixture.debugElement.query(By.css('.settings__item--unit'));
    const inputElem = fixture.debugElement.query(By.css('.custom-input'));


    const min = -100;
    const max = 125;
    const step = 12;
    const unit = 'tests';
    const data = 23;

    component.min = min;
    component.max = max;
    component.step = step;
    component.unit = unit;
    component.data = data;

    fixture.detectChanges();
    await fixture.whenStable();

    expect(parseInt(rangeElem.nativeElement.min)).toEqual(min);
    expect(parseInt(rangeElem.nativeElement.max)).toEqual(max);
    expect(parseInt(rangeElem.nativeElement.step)).toEqual(step);

    expect(minElem.nativeElement.textContent).toEqual(`${min}`);
    expect(maxElem.nativeElement.textContent).toEqual(`${max}`);
    expect(unitElem.nativeElement.textContent).toEqual(unit);

    expect(parseInt(rangeElem.nativeElement.value)).toEqual(20);
    expect(parseInt(inputElem.nativeElement.value)).toEqual(data);
  });

  it ('should correctly update values when updating text input', async () => {
    const updatedValue = 5;

    const emitter = spyOn(component.dataChange, 'emit').and.callThrough();
    const onModelChange = spyOn(component, 'update').and.callThrough();
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    inputElem.nativeElement.value = 5;
    inputElem.nativeElement.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.data).toEqual(updatedValue);
    expect(rangeElem.nativeElement.value).toEqual(`${updatedValue}`);

    expect(onModelChange).toHaveBeenCalledOnceWith(updatedValue);
    expect(emitter).toHaveBeenCalledOnceWith(updatedValue);
  });

  it ('should correctly update values when updating range input', async () => {
    const updatedValue = 8;

    const emitter = spyOn(component.dataChange, 'emit').and.callThrough();
    const onModelChange = spyOn(component, 'update').and.callThrough();
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    rangeElem.nativeElement.value = updatedValue;
    rangeElem.nativeElement.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.data).toEqual(8);
    expect(inputElem.nativeElement.value).toEqual(`${updatedValue}`);

    expect(onModelChange).toHaveBeenCalledOnceWith(updatedValue);
    expect(emitter).toHaveBeenCalledOnceWith(updatedValue);
  });
});
