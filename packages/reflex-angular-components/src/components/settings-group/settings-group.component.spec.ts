import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsGroupComponent } from './settings-group.component';
import { By } from '@angular/platform-browser';

describe('SettingsGroupComponent', () => {
  let component: SettingsGroupComponent;
  let fixture: ComponentFixture<SettingsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SettingsGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it ('should assign default id', () => {
    const defaultId = 'custom';

    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}`)

    const labelElem = fixture.debugElement.query(By.css('.settings__group--button'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${defaultId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${defaultId}-label`);
  });

  it ('should set id correctly', () => {
    const testId = 'OptionCheckBoxTestId';
    component.toggleId = testId;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    expect(inputElem.nativeElement.getAttribute('id')).toEqual(`${testId}`);
    expect(inputElem.nativeElement.getAttribute('name')).toEqual(`${testId}`)

    const labelElem = fixture.debugElement.query(By.css('.settings__group--button'));
    expect(labelElem.nativeElement.getAttribute('id')).toEqual(`${testId}-label`);
    expect(labelElem.nativeElement.getAttribute('name')).toEqual(`${testId}-label`);
  });

  it ('should assign default title', () => {
    const defaultTitle = 'Custom Title';

    const inputElem = fixture.debugElement.query(By.css('.heading-tertiary'));
    expect(inputElem.nativeElement.textContent).toEqual(`${defaultTitle}`);
  });

  it ('should set title correctly', () => {
    const testTitle = 'OptionCheckBox - TestTitle';
    component.elementTitle = testTitle;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.heading-tertiary'));
    expect(inputElem.nativeElement.textContent).toEqual(`${testTitle}`);
  });

  it ('should hove correct initial state', () => {
    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    const defaultState = inputElem.nativeElement.checked;
    const content = fixture.debugElement.query(By.css('.settings__group--body'));

    expect(defaultState).toBeFalsy();

    const style = getComputedStyle(content.nativeElement)
    expect(style.display).toEqual('none');
    expect(style.visibility).toEqual('collapse');
  });

  it ('should correctly hide/display content', () => {
    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    const content = fixture.debugElement.query(By.css('.settings__group--body'));

    inputElem.nativeElement.click();

    fixture.detectChanges();

    expect(inputElem.nativeElement.checked).toBeTruthy();
    const style1 = getComputedStyle(content.nativeElement)
    expect(style1.display).not.toEqual('none');
    expect(style1.visibility).toEqual('visible');

    inputElem.nativeElement.click();

    fixture.detectChanges();

    expect(inputElem.nativeElement.checked).toBeFalsy();

    const style2 = getComputedStyle(content.nativeElement)
    expect(style2.display).toEqual('none');
    expect(style2.visibility).toEqual('collapse');
  });

});
