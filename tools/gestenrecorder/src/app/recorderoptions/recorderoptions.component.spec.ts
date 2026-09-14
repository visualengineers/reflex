import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecorderoptionsComponent } from './recorderoptions.component';

describe('RecorderoptionsComponent', () => {
  let component: RecorderoptionsComponent;
  let fixture: ComponentFixture<RecorderoptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecorderoptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecorderoptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
