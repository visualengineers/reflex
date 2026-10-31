import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ValueSliderComponent } from './value-slider.component';

export let component: ValueSliderComponent;

export let fixture: ComponentFixture<ValueSliderComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ValueSliderComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
}
