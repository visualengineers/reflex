import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceVisualizationComponent } from './performance-visualization.component';

describe('PerformanceVisualizationComponent', () => {
  let component: PerformanceVisualizationComponent;
  let fixture: ComponentFixture<PerformanceVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [PerformanceVisualizationComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(PerformanceVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
