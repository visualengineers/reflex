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

    const disabled = toggle.nativeElement.disabled;
    expect(disabled).toBeFalsy();

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

    const disabled = toggle.nativeElement.disabled;
    expect(disabled).toBeFalsy();
  })

  it('should correctly set data binding for toggle data', async () => {
    await fixture.whenStable();
    const toggle: HTMLInputElement = fixture.nativeElement.querySelector('#testId-toggle');
    const message: HTMLElement = fixture.nativeElement.querySelector('#toggleMessage');
    expect(toggle.checked).toBeTrue();
    expect(message.classList).toContain('bg-active');

    component.toggleHeaderActive = false;
    // This assignment simulates a parent update outside an Angular event handler.
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(toggle.checked).toBeFalse();
    expect(message.classList).toContain('bg-inactive');
  });

  it('should correctly set data binding for disabled state', async () => {
    await fixture.whenStable();
    const toggle: HTMLInputElement = fixture.nativeElement.querySelector('#testId-toggle');
    expect(toggle.disabled).toBeFalse();

    component.canToggleHeader = false;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(toggle.disabled).toBeTrue();

    component.canToggleHeader = true;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(toggle.disabled).toBeFalse();
  });

  it('should correctly update bound data when interacting', async () => {
    await fixture.whenStable();
    const toggle: HTMLInputElement = fixture.nativeElement.querySelector('#testId-toggle');
    const message: HTMLElement = fixture.nativeElement.querySelector('#toggleMessage');

    toggle.click();
    await fixture.whenStable();
    expect(component.toggleHeaderActive).toBeFalse();
    expect(toggle.checked).toBeFalse();
    expect(message.classList).toContain('bg-inactive');

    toggle.click();
    await fixture.whenStable();
    expect(component.toggleHeaderActive).toBeTrue();
    expect(toggle.checked).toBeTrue();
    expect(message.classList).toContain('bg-active');
  });
});
