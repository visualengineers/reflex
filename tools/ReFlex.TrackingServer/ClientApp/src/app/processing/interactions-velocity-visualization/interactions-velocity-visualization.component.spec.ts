import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionVelocity, Point3 } from '@reflex/shared-types';
import { InteractionsVelocityVisualizationComponent } from './interactions-velocity-visualization.component';

const point = (x: number, y = 40): Point3 => ({ x, y, z: -0.5, isValid: true, isFiltered: false });
const snapshot = (frame = 3): InteractionVelocity => ({
  touchId: 42,
  frameId: frame,
  lastMeasuredFrameId: frame,
  timestampSeconds: frame / 10,
  lastMeasuredTimestampSeconds: frame / 10,
  predictionTimestampSeconds: (frame / 10) + 0.05,
  predictionHorizonSeconds: 0.05,
  confidence: 7.5,
  sampleCount: 3,
  isPredicted: false,
  isPublished: true,
  suppressionReason: '',
  useSecondDerivation: true,
  width: 320,
  height: 240,
  measuredPosition: point(100),
  smoothedPosition: point(95),
  matchingPosition: point(98),
  firstDerivation: point(5, 0),
  secondDerivation: point(2, 0),
  predictedPositionBasic: point(105),
  predictedPositionAdvanced: point(106)
});

describe('Prediction diagnostics in sensor coordinates', () => {
  let fixture: ComponentFixture<InteractionsVelocityVisualizationComponent>;
  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const show = async (data: Array<InteractionVelocity>): Promise<void> => {
    fixture.componentRef.setInput('data', data);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InteractionsVelocityVisualizationComponent] }).compileComponents();
    fixture = TestBed.createComponent(InteractionsVelocityVisualizationComponent);
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
    expect(element().textContent).toContain('forecast +50 ms');
    expect(element().textContent).toContain('target t=0.350 s');
    expect(element().textContent).toContain('#42');
    expect(data).toEqual(before);
  });

  it('uses a responsive viewBox rather than accumulating pixel scaling on repeated renders', async () => {
    await show([snapshot()]);
    await show([snapshot(4)]);
    element().style.width = '200px';
    expect(element().querySelector('.linear.forecast')?.getAttribute('cx')).toBe('105');
    expect(element().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 320 240');
  });

  it('marks missing measurements and does not append synthetic trail points', async () => {
    await show([snapshot()]);
    await show([{ ...snapshot(4), lastMeasuredFrameId: 3, lastMeasuredTimestampSeconds: 0.325, confidence: 4.5, isPredicted: true }]);
    expect(element().querySelector('g.lost')).not.toBeNull();
    expect(element().textContent).toContain('lost');
    expect(element().querySelectorAll('tbody td')[3].textContent?.trim()).toBe('75');
    expect(element().querySelectorAll('tbody td')[2].textContent?.trim()).toBe('4.5');
    expect(element().textContent).toContain('(px/s²)');
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
    expect(element().textContent).toContain('No prediction data');
    expect(fixture.componentInstance.trails.size).toBe(0);
  });

  it('lets users hide forecast layers independently', async () => {
    await show([snapshot()]);
    const toggles = element().querySelectorAll<HTMLInputElement>('input');
    toggles[1].click();
    await fixture.whenStable();
    expect(element().querySelector('.linear.forecast')).toBeNull();
    expect(element().querySelector('.accelerated.forecast')).not.toBeNull();
  });
  it('keeps hidden tracks and their trails visible with the publication reason', async () => {
    const hidden = { ...snapshot(), isPublished: false, suppressionReason: 'confidence' };
    await show([hidden]);
    expect(element().textContent).toContain('hidden: confidence');
    expect(element().querySelector('g.suppressed')).not.toBeNull();
    expect(fixture.componentInstance.path(42)).toBe('100,40');
    await show([{ ...hidden, frameId: 4, isPredicted: true, suppressionReason: 'cluster' }]);
    expect(element().textContent).toContain('hidden: cluster');
    expect(fixture.componentInstance.path(42)).toBe('100,40');
    await show([]);
    expect(fixture.componentInstance.path(42)).toBe('');
  });

});
