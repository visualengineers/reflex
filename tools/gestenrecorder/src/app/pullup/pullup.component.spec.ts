import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PullupComponent } from './pullup.component';

describe('PullupComponent', () => {
  let component: PullupComponent;
  let fixture: ComponentFixture<PullupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PullupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PullupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
