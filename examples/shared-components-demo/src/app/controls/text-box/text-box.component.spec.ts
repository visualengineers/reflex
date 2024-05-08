import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextBoxComponent } from './text-box.component';

describe('TextBoxComponent', () => {
  let component: TextBoxComponent;
  let fixture: ComponentFixture<TextBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextBoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
