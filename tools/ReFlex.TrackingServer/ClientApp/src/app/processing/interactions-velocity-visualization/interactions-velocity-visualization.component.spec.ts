import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionVelocity, Point3 } from '@reflex/shared-types';
import { predictionSnapshot as snapshot } from './interactions-velocity-visualization.component.test-data';
import { InteractionsVelocityVisualizationComponent } from './interactions-velocity-visualization.component';

describe('Prediction overlay in calibrated coordinates', () => {
  let fixture: ComponentFixture<InteractionsVelocityVisualizationComponent>;
  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const show = async (data: Array<InteractionVelocity>): Promise<void> => {
    const normalized = (point: Point3): Point3 => ({ ...point, x: point.x / 320, y: point.y / 240 });
    fixture.componentRef.setInput('data', data.map((item) => ({
      ...item,
      measuredPosition: normalized(item.measuredPosition),
      smoothedPosition: normalized(item.smoothedPosition),
      matchingPosition: normalized(item.matchingPosition),
      predictedPositionBasic: normalized(item.predictedPositionBasic),
      predictedPositionAdvanced: normalized(item.predictedPositionAdvanced)
    })));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InteractionsVelocityVisualizationComponent] }).compileComponents();
    fixture = TestBed.createComponent(InteractionsVelocityVisualizationComponent);
    fixture.componentRef.setInput('width', 320);
    fixture.componentRef.setInput('height', 240);
  });

  it('renders distinct measured, smoothed, matching and next-frame positions without mutating input', async () => {
    const data = snapshot();
    const before = structuredClone(data);
    await show([data]);
    expect(element().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 320 240');
    expect(element().querySelector('.measured')?.getAttribute('cx')).toBe('100');
    expect(element().querySelector('.smoothed')?.getAttribute('x')).toBe('92');
    expect(element().querySelector('.linear.forecast')?.getAttribute('cx')).toBe('105');
    expect(element().querySelector('.accelerated.forecast')?.getAttribute('cx')).toBe('106');
    expect(element().querySelector('svg')?.getAttribute('preserveAspectRatio')).toBe('none');
    expect(element().querySelector('table')).toBeNull();
    expect(element().textContent).toContain('#42');
    expect(data).toEqual(before);
  });

  it('uses a responsive viewBox rather than accumulating pixel scaling on repeated renders', async () => {
    await show([snapshot()]);
    await show([snapshot(4)]);
    fixture.componentRef.setInput('width', 640);
    fixture.componentRef.setInput('height', 480);
    await fixture.whenStable();
    expect(element().querySelector('.linear.forecast')?.getAttribute('cx')).toBe('210');
    expect(element().querySelector('.linear.forecast')?.getAttribute('cy')).toBe('80');
    expect(element().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 640 480');
    expect(fixture.componentInstance.path(42)).toBe('200,80 200,80');
  });

  it('marks missing measurements and does not append synthetic trail points', async () => {
    await show([snapshot()]);
    await show([{ ...snapshot(4), lastMeasuredFrameId: 3, lastMeasuredTimestampSeconds: 0.325, confidence: 4.5, isPredicted: true }]);
    expect(element().querySelector('g.lost')).not.toBeNull();
    expect(element().textContent).toContain('lost');

    expect(fixture.componentInstance.trails.get(42)).toHaveLength(1);
  });

  it('clears stale tracks on empty data and starts a new trail after a frame reset', async () => {
    await show([snapshot()]);
    await show([snapshot(4)]);
    expect(fixture.componentInstance.trails.get(42)).toHaveLength(2);
    await show([snapshot(1)]);
    expect(fixture.componentInstance.trails.get(42)).toHaveLength(1);
    await show([]);
    expect(element().querySelector('[data-touch-id]')).toBeNull();

    expect(fixture.componentInstance.trails.size).toBe(0);
  });

  it('lets users hide forecast layers independently', async () => {
    await show([snapshot()]);
    fixture.componentRef.setInput('showLinear', false);
    await fixture.whenStable();
    expect(element().querySelector('.linear.forecast')).toBeNull();
    expect(element().querySelector('.accelerated.forecast')).not.toBeNull();
  });
  it('keeps hidden tracks and their trails visible with the publication reason', async () => {
    const hidden = { ...snapshot(), isPublished: false, suppressionReason: 'confidence' };
    await show([hidden]);

    expect(element().querySelector('g.suppressed')).not.toBeNull();
    expect(fixture.componentInstance.path(42)).toBe('100,40');
    await show([{ ...hidden, frameId: 4, isPredicted: true, suppressionReason: 'cluster' }]);

    expect(fixture.componentInstance.path(42)).toBe('100,40');
    await show([]);
    expect(fixture.componentInstance.path(42)).toBe('');
  });

});
