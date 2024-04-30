import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueSelectionComponent } from './value-selection.component';

describe('ValueSelectionComponent', () => {
  let component: ValueSelectionComponent;
  let fixture: ComponentFixture<ValueSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValueSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
