import { TestBed } from '@angular/core/testing';
import { InteractionVelocity } from '@reflex/shared-types';
import { predictionSnapshot } from '../interactions-velocity-visualization/interactions-velocity-visualization.component.test-data';
import { KalmanVisualizationComponent } from './kalman-visualization.component';

const sample = (frame: number): InteractionVelocity => ({
  ...predictionSnapshot(frame),
  useKalmanFilter: true,
  measuredPosition: { ...predictionSnapshot().measuredPosition, x: frame / 100 },
  kalmanPosition: { ...predictionSnapshot().smoothedPosition, x: (frame / 100) + .01 },
  kalmanUncertainty: [.1, .2, .1].map((x) => ({ ...predictionSnapshot().measuredPosition, x, y: .1 }))
});

describe('Kalman visualization trajectories', () => {
  it('bounds history and does not invent measurements on coasting, duplicate snapshots or resize', async () => {
    const fixture = TestBed.createComponent(KalmanVisualizationComponent);
    for (let frame = 1; frame <= 65; frame++) {
      fixture.componentRef.setInput('data', [sample(frame)]);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance.trails.get(42)?.measurements).toHaveLength(60);
    const held = { ...sample(66), isPredicted: true, lastMeasuredFrameId: 65 };
    fixture.componentRef.setInput('data', [held]);
    fixture.detectChanges();
    fixture.componentRef.setInput('width', 800);
    fixture.detectChanges();
    expect(fixture.componentInstance.trails.get(42)?.measurements).toHaveLength(60);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.kalman-measurement')).toHaveLength(60);
    expect((fixture.nativeElement as HTMLElement).querySelector('.innovation')).toBeNull();
    fixture.componentRef.setInput('data', [sample(1)]);
    fixture.detectChanges();
    expect(fixture.componentInstance.trails.get(42)?.estimates).toHaveLength(1);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.trails.size).toBe(0);
    await fixture.whenStable();
  });
});
