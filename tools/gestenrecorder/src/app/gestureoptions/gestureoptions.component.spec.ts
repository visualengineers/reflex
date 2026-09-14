import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureoptionsComponent } from './gestureoptions.component';

describe('GestureoptionsComponent', () => {
  let component: GestureoptionsComponent;
  let fixture: ComponentFixture<GestureoptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestureoptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestureoptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
