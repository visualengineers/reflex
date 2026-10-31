import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { OptionCheckboxComponent } from './option-checkbox.component';

export let component: OptionCheckboxComponent;

export let fixture: ComponentFixture<OptionCheckboxComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, OptionCheckboxComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
}
