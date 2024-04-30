import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueTextComponent } from './value-text.component';

describe('ValueTextComponent', () => {
  let component: ValueTextComponent;
  let fixture: ComponentFixture<ValueTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ValueTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
