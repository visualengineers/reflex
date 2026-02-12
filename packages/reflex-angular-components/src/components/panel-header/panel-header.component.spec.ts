import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelHeaderComponent } from './panel-header.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('PanelHeaderComponent', () => {
  let component: PanelHeaderComponent;
  let fixture: ComponentFixture<PanelHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, PanelHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it ('should assign default id', () => {
    const defaultId = 'custom-header';

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-toggle`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-toggle`)

    const labelElem = fixture.debugElement.query(By.css('.checkbox-toggle-label'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-label`);
  });

  it ('should set id correctly', () => {
    const testId = 'PanelHeaderTestId';
    component.elementId = testId;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${testId}-toggle`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${testId}-toggle`)

    const labelElem = fixture.debugElement.query(By.css('.checkbox-toggle-label'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${testId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${testId}-label`);
  });

  it ('should assign default title', () => {
    const defaultTitle = 'Custom Title';

    const inputElem = fixture.debugElement.query(By.css('.heading-secondary'));
    expect(inputElem.nativeElement.textContent).toEqual(`${defaultTitle}`);
  });

  it ('should set title correctly', () => {
    const testTitle = 'PanelHeaderComponent - TestTitle';
    component.elementTitle = testTitle;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.heading-secondary'));
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

  it ('should correctly set checked state', () => {
    const emitter = spyOn(component.dataChange, 'emit').and.callThrough();
    const onModelChange = spyOn(component, 'update').and.callThrough();

    const inputElem = fixture.debugElement.query(By.css('.checkbox-toggle'));
    inputElem.nativeElement.click();

    fixture.detectChanges();

    expect(component.data).toEqual(true);
    expect(inputElem.nativeElement.checked).toBeTruthy();

    expect(onModelChange).toHaveBeenCalledOnceWith(true);
    expect(emitter).toHaveBeenCalledOnceWith(true);
  });
});
