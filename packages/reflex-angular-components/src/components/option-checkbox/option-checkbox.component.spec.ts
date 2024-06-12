import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { OptionCheckboxComponent } from './option-checkbox.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('OptionCheckboxComponent', () => {
  let component: OptionCheckboxComponent;
  let fixture: ComponentFixture<OptionCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, OptionCheckboxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it ('should assign default id', () => {
    const defaultId = 'custom-checkbox';

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-checkbox`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-checkbox`)

    const labelElem = fixture.debugElement.query(By.css('.checkbox-toggle-label'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-label`);
  });

  it ('should set id correctly', () => {
    const testId = 'OptionCheckBoxTestId';
    component.elementId = testId;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${testId}-checkbox`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${testId}-checkbox`)

    const labelElem = fixture.debugElement.query(By.css('.checkbox-toggle-label'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${testId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${testId}-label`);
  });

  it ('should assign default title', () => {
    const defaultTitle = 'Custom Value';

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(inputElem.nativeElement.textContent).toEqual(`${defaultTitle}`);
  });

  it ('should set title correctly', () => {
    const testTitle = 'OptionCheckBox - TestTitle';
    component.elementTitle = testTitle;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(inputElem.nativeElement.textContent).toEqual(`${testTitle}`);
  });

  it ('should assign default disabled state', () => {
    const defaultState = false;

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.disabled).toEqual(defaultState);
  });

  it ('should correctly set disabled state', () => {
    const newState = true;
    component.disabled = newState;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.disabled).toEqual(newState);
  });

  it ('should assign default checked state', () => {
    const defaultState = false;

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.checked).toEqual(defaultState);
  });

  it ('should correctly set checked state', fakeAsync(() => {
    const emitter = spyOn(component.dataChange, 'emit').and.callThrough();
    const onModelChange = spyOn(component, 'onModelChange').and.callThrough();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    inputElem.nativeElement.click();

    fixture.detectChanges();
    tick();

    expect(component.data).toEqual(true);
    expect(inputElem.nativeElement.checked).toBeTruthy();

    expect(onModelChange).toHaveBeenCalledOnceWith(true);
    expect(emitter).toHaveBeenCalledOnceWith(true);
  }));
});
