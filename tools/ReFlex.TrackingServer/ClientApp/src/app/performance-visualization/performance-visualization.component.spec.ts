import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../../test/helpers/dom';

import { PerformanceVisualizationComponent } from './performance-visualization.component';

describe('PerformanceVisualizationComponent', () => {
  let component: PerformanceVisualizationComponent;
  let fixture: ComponentFixture<PerformanceVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceVisualizationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('renders stacked areas, averages and pointer tooltips after input updates', async () => {
    await fixture.whenStable();
    const panel: HTMLElement = queryElement((fixture.nativeElement as HTMLInputElement), '.visualization__panel');
    Object.defineProperty(panel, 'clientWidth', { value: 600 });
    Object.defineProperty(panel, 'clientHeight', { value: 180 });
    const samples = [
      {
        frameId: 1,
        frameStart: 0,
        frameEnd: 1000,
        totalFrameTime: 1,
        boxFilter: 5,
        totalFilter: 5,
        totalProcessing: 10
      },
      {
        frameId: 2,
        frameStart: 1000,
        frameEnd: 2000,
        totalFrameTime: 1,
        boxFilter: 15,
        totalFilter: 15,
        totalProcessing: 30
      }
    ];
    fixture.componentRef.setInput('refreshRate', 1);
    fixture.componentRef.setInput('numSamples', 2);
    fixture.componentRef.setInput('groups', ['boxFilter']);
    fixture.componentRef.setInput('data', samples);
    await fixture.whenStable();
    expect(panel.querySelectorAll('.valgroup path').length).toBe(1);
    expect(
      queryElement(panel, '.valgroup path')?.getAttribute('d')
    ).not.toContain('NaN');
    expect(panel.textContent).toContain('10.00 ms');

    const svg = queryElement(panel, 'svg');
    const bounds = svg.getBoundingClientRect();
    svg.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: bounds.left + 20,
        clientY: bounds.top + 20
      })
    );
    fixture.componentRef.setInput('data', [...samples]);
    await fixture.whenStable();
    expect(panel.textContent).toContain('Total:');
    expect(panel.textContent).toContain('5.00 ms');

    fixture.componentRef.setInput('isProcessingGraph', true);
    await fixture.whenStable();
    expect(panel.textContent).toContain('20.00 ms');
  });
});
