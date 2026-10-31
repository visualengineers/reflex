import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { PanelComponent } from './panel.component';

export let component: PanelComponent;

export let fixture: ComponentFixture<PanelComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelComponent, SettingsGroupComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
}
