import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingoptionsComponent } from './savingoptions.component';

describe('SavingoptionsComponent', () => {
  let component: SavingoptionsComponent;
  let fixture: ComponentFixture<SavingoptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingoptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SavingoptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
