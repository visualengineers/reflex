import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsGroupComponent } from './settings-group.component';

export let component: SettingsGroupComponent;

export let fixture: ComponentFixture<SettingsGroupComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsGroupComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
}
