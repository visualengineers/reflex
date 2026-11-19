import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionVelocity } from '@reflex/shared-types';
import { predictionSnapshot } from '../interactions-velocity-visualization/interactions-velocity-visualization.component.test-data';
import { ForecastValuesComponent } from './forecast-values.component';

describe('Forecast values table', () => {
  let fixture: ComponentFixture<ForecastValuesComponent>;
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const show = async (data: Array<InteractionVelocity>): Promise<void> => {
    fixture.componentRef.setInput('data', data);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ForecastValuesComponent] }).compileComponents();
    fixture = TestBed.createComponent(ForecastValuesComponent);
  });

  it('keeps ten rows with zero, one or several contacts and preserves every contact above ten', async () => {
    for (const count of [0, 1, 7, 12, 2, 0]) {
      await show(Array.from({ length: count }, (value, touchId) => ({ ...predictionSnapshot(), touchId })));
      expect(root().querySelectorAll('tbody tr')).toHaveLength(Math.max(10, count));
      expect(root().querySelectorAll('.forecast-values__empty-row')).toHaveLength(Math.max(0, 10 - count));
      expect(root().querySelectorAll('.forecast-values__empty-row td')).toHaveLength(Math.max(0, 10 - count) * 10);
    }
  });

  it('sorts contacts by ID without changing input and displays sensor units and frame timing', async () => {
    const data = [{ ...predictionSnapshot(), touchId: 42 }, { ...predictionSnapshot(), touchId: 3 }];
    const before = structuredClone(data);
    await show(data);
    const cells = root().querySelectorAll('tbody td');
    expect(cells[0].textContent).toContain('#3');
    expect(cells[4].textContent).toContain('100.0 / 40.0');
    expect(root().textContent).toContain('forecast +50 ms');
    expect(root().textContent).toContain('target t=0.350 s');
    expect(root().textContent).toContain('(px/s²)');
    expect(data).toEqual(before);
  });

  it('uses the shared collapsible group and shows measurement age and suppression state', async () => {
    await show([
      { ...predictionSnapshot(4),
        lastMeasuredTimestampSeconds: 0.325,
        isPredicted: true,
        isPublished: false,
        suppressionReason: 'confidence',
        confidence: 4.5 }
    ]);
    const toggle = root().querySelector<HTMLInputElement>('#forecast-values-toggle');
    expect(toggle?.checked).toBe(false);
    toggle?.click();
    await fixture.whenStable();
    expect(toggle?.checked).toBe(true);
    const cells = root().querySelectorAll('tbody td');
    expect(cells[2].textContent?.trim()).toBe('4.5');
    expect(cells[3].textContent?.trim()).toBe('75');
    expect(root().textContent).toContain('hidden: confidence');
    toggle?.click();
    expect(toggle?.checked).toBe(false);
  });
});
