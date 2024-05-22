import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouchAreaComponent } from './touch-area.component';

describe('TouchAreaComponent', () => {
  let component: TouchAreaComponent;
  let fixture: ComponentFixture<TouchAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TouchAreaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TouchAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
