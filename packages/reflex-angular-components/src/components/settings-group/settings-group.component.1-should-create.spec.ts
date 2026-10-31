import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './settings-group.component.test-context';

describe('SettingsGroupComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign default id', () => {
    const defaultId = 'custom';

    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(`${defaultId}`);
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(`${defaultId}`);

    const labelElem = fixture.debugElement.query(By.css('.settings__group--button'));
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(`${defaultId}-label`);
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(`${defaultId}-label`);
  });

  it('should set id correctly', () => {
    const testId = 'SettingsGroupTestId';
    fixture.componentRef.setInput('toggleId', testId);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(`${testId}`);
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(`${testId}`);

    const labelElem = fixture.debugElement.query(By.css('.settings__group--button'));
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('id')).toEqual(`${testId}-label`);
    expect((labelElem.nativeElement as HTMLInputElement).getAttribute('name')).toEqual(`${testId}-label`);
  });

  it('should assign default title', () => {
    const defaultTitle = 'Custom Title';

    const inputElem = fixture.debugElement.query(By.css('.heading-tertiary'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${defaultTitle}`);
  });

  it('should set title correctly', () => {
    const testTitle = 'SettingsGroup - TestTitle';
    fixture.componentRef.setInput('elementTitle', testTitle);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.heading-tertiary'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${testTitle}`);
  });

  it('should hove correct initial state', () => {
    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    const defaultState = (inputElem.nativeElement as HTMLInputElement).checked;
    const content = fixture.debugElement.query(By.css('.settings__group--body'));

    expect(defaultState).toBeFalsy();

    const style = getComputedStyle((content.nativeElement as HTMLInputElement));
    expect(style.display).toEqual('none');
    expect(style.visibility).toEqual('collapse');
  });

  it('should correctly hide/display content', () => {
    const inputElem = fixture.debugElement.query(By.css('.settings__group--checkbox'));
    const content = fixture.debugElement.query(By.css('.settings__group--body'));

    (inputElem.nativeElement as HTMLInputElement).click();

    fixture.detectChanges();

    expect((inputElem.nativeElement as HTMLInputElement).checked).toBeTruthy();
    const style1 = getComputedStyle((content.nativeElement as HTMLInputElement));
    expect(style1.display).not.toEqual('none');
    expect(style1.visibility).toEqual('visible');

    (inputElem.nativeElement as HTMLInputElement).click();

    fixture.detectChanges();

    expect((inputElem.nativeElement as HTMLInputElement).checked).toBeFalsy();

    const style2 = getComputedStyle((content.nativeElement as HTMLInputElement));
    expect(style2.display).toEqual('none');
    expect(style2.visibility).toEqual('collapse');
  });
});
