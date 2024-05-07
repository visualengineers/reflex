import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionCheckboxComponent } from './option-checkbox.component';
import { FormsModule } from '@angular/forms';

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
});
