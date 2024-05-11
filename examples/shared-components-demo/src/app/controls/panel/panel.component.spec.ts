import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelComponent } from './panel.component';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { By } from '@angular/platform-browser';

describe('PanelComponent', () => {
  let component: PanelComponent;
  let fixture: ComponentFixture<PanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelComponent, SettingsGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign the correct element name and id', () => {
    const settingsGroup = fixture.debugElement.query(By.css('app-panel-header'));
    expect(settingsGroup).toBeTruthy();

    const id = "testId-toggle"

    const toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    const name = toggle.nativeElement.getAttribute('name');
    expect(name).toEqual(id);

    const type = toggle.nativeElement.getAttribute('type');
    expect(type).toEqual('checkbox');

    const disabled = toggle.nativeElement.getAttribute('disabled');
    expect(disabled).toEqual('false');

  })

  it('should set correct attributes for input and label', () => {
    const settingsGroup = fixture.debugElement.query(By.css('app-panel-header'));
    expect(settingsGroup).toBeTruthy();

    const id = "testId-toggle";
    const labelId = "testId-label";

    const toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    const label = settingsGroup.query(By.css(`#${labelId}`));
    expect(label).toBeTruthy();

    const name = toggle.nativeElement.getAttribute('name');
    expect(name).toEqual(id);

    const aria_label = toggle.nativeElement.getAttribute('aria-labelledby');
    expect(aria_label).toEqual(labelId);

    const aria_name = label.nativeElement.getAttribute('name');
    expect(aria_name).toEqual(labelId);

    const type = toggle.nativeElement.getAttribute('type');
    expect(type).toEqual('checkbox');

    const classToggle = toggle.nativeElement.getAttribute('class');
    expect(classToggle).toContain('checkbox-toggle');

    const classLabel = label.nativeElement.getAttribute('class');
    expect(classLabel).toContain('checkbox-toggle-label');

    const disabled = toggle.nativeElement.getAttribute('disabled');
    expect(disabled).toEqual('false');
  })

  it('should correctly set data binding for toggle data', () => {
    const settingsGroup = fixture.debugElement.query(By.css('app-panel-header'));
    expect(settingsGroup).toBeTruthy();

    const id = "testId-toggle";

    component.toggleHeaderActive = true;
    fixture.detectChanges();

    let toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    let messageElem = fixture.debugElement.query(By.css('#toggleMessage'));
    expect(messageElem).toBeTruthy();

    let messageClass = messageElem.nativeElement.getAttribute('class');
    expect(messageClass).toContain('bg-active');

    let model = toggle.nativeElement.getAttribute('ng-reflect-model');
    expect(model).toEqual('true');

    component.toggleHeaderActive = false;
    fixture.detectChanges();

    toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    messageElem = fixture.debugElement.query(By.css('#toggleMessage'));
    expect(messageElem).toBeTruthy();

    messageClass = messageElem.nativeElement.getAttribute('class');
    expect(messageClass).toContain('bg-inactive');

    model = toggle.nativeElement.getAttribute('ng-reflect-model');
    expect(model).toEqual('false');

  });

  it('should correctly set data binding for disabled state', () => {
    const settingsGroup = fixture.debugElement.query(By.css('app-panel-header'));
    expect(settingsGroup).toBeTruthy();

    const id = "testId-toggle";

    component.canToggleHeader = true;
    fixture.detectChanges();

    let toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    let disabled = toggle.nativeElement.getAttribute('disabled');
    expect(disabled).toEqual('false');

    component.canToggleHeader = false;
    fixture.detectChanges();

    toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    disabled = toggle.nativeElement.getAttribute('disabled');
    expect(disabled).toEqual('true');

  });

  it('should correctly update bound data when interacting', () => {
    const settingsGroup = fixture.debugElement.query(By.css('app-panel-header'));
    expect(settingsGroup).toBeTruthy();

    const id = "testId-toggle";

    component.toggleHeaderActive = true;
    fixture.detectChanges();

    let toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    let messageElem = fixture.debugElement.query(By.css('#toggleMessage'));
    expect(messageElem).toBeTruthy();

    let messageClass = messageElem.nativeElement.getAttribute('class');
    expect(messageClass).toContain('bg-active');

    let model = toggle.nativeElement.getAttribute('ng-reflect-model');
    expect(model).toEqual('true');

    component.toggleHeaderActive = false;
    fixture.detectChanges();

    toggle = settingsGroup.query(By.css(`#${id}`));
    expect(toggle).toBeTruthy();

    messageElem = fixture.debugElement.query(By.css('#toggleMessage'));
    expect(messageElem).toBeTruthy();

    messageClass = messageElem.nativeElement.getAttribute('class');
    expect(messageClass).toContain('bg-inactive');

    model = toggle.nativeElement.getAttribute('ng-reflect-model');
    expect(model).toEqual('false');

  })
});
