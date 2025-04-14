import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionsVelocityVisualizationComponent } from './interactions-velocity-visualization.component';

describe('InteractionsVelocityVisualizationComponent', () => {
  let component: InteractionsVelocityVisualizationComponent;
  let fixture: ComponentFixture<InteractionsVelocityVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionsVelocityVisualizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InteractionsVelocityVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
