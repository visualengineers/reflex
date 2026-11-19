import { HttpResponse } from '@angular/common/http';
import { Interaction, InteractionVelocity } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import { calibration, mount, processing, setupTests as setupZonelessTests } from '../../test-utils/zoneless-change-detection.test-context';
import { frame } from '../../test-utils/zoneless-change-detection.test-data';
import { predictionSnapshot } from '../interactions-velocity-visualization/interactions-velocity-visualization.component.test-data';
import { InteractionsVisualizationComponent } from './interactions-visualization.component';

function setupPredictionTests(): void {
  setupZonelessTests();
  beforeEach(() => {
    calibration.getFrameSize.mockReturnValue(of(frame));
    calibration.computeCalibratedPosition.mockImplementation((items: Array<Interaction>) => of(new HttpResponse({
      body: items.map((item) => ({ ...item,
        position: { ...item.position,
          x: (item.position.x / 400) + 0.1,
          y: (item.position.y / 200) - 0.05 } }))
    })));
  });
}

describe('Kalman and prediction display controls', () => {
  setupPredictionTests();

  const kalmanSample = (frameId = 3): InteractionVelocity => ({
    ...predictionSnapshot(frameId),
    useKalmanFilter: true,
    useVelocityPrediction: false,
    useSecondDerivation: false,
    kalmanPosition: { ...predictionSnapshot().smoothedPosition },
    kalmanVarianceX: 4,
    kalmanVarianceY: 9
  });

  it('disables switches for inactive algorithms and keeps all display controls inside the visualization', async () => {
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('predictionEnabled', false);
    fixture.componentRef.setInput('kalmanEnabled', false);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const panel = queryElement(root, '.interactions__visualization app-settings-group');
    expect(queryElement<HTMLInputElement>(panel, '#processing-showPrediction-checkbox').disabled).toBe(true);
    expect(queryElement<HTMLInputElement>(panel, '#processing-showKalman-checkbox').disabled).toBe(true);
    expect(queryElement<HTMLInputElement>(panel, '#processing-showKalman-checkbox').checked).toBe(false);
    expect(queryElement<HTMLInputElement>(panel, '#processing-showPrediction-checkbox').checked).toBe(false);
    const legend = queryElement(root, '.motion-legend');
    expect(legend.textContent).not.toContain('Linear forecast');
    expect(legend.textContent).not.toContain('Kalman track');
    expect(processing.getVelocities.mock.calls).toHaveLength(0);
  });

  it('streams Kalman without prediction, transforms uncertainty and releases the stream when the last layer is hidden', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('predictionEnabled', false);
    fixture.componentRef.setInput('kalmanEnabled', true);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    const original = kalmanSample();
    const before = structuredClone(original);
    stream.next([original]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-interactions-velocity-visualization')).toBeNull();
    expect(root.querySelector('.kalman-track')).not.toBeNull();
    expect(root.querySelector('.kalman-uncertainty')).not.toBeNull();
    expect(calibration.computeCalibratedPosition.mock.calls[0][0]).toHaveLength(38);
    const points = fixture.componentInstance.predictionData[0].kalmanUncertainty ?? [];
    expect(points).toHaveLength(32);
    expect(points[0].x).toBeCloseTo(((95 + Math.sqrt(5.991464547 * 4)) / 400) + 0.1);
    expect(points[8].y).toBeCloseTo(((40 + Math.sqrt(5.991464547 * 9)) / 200) - 0.05);
    expect(original).toEqual(before);
    const legend = queryElement(root, '.motion-legend');
    expect(legend.textContent).toContain('Kalman track / estimate');
    expect(legend.textContent).toContain('95% position uncertainty');
    expect(legend.textContent).not.toContain('Linear forecast');
    expect(legend.textContent).not.toContain('Ground truth');
    // Expand the same collapsible settings panel used by the point-cloud visualization.
    queryElement<HTMLInputElement>(root, '#motion-display-settings-toggle').click();
    await fixture.whenStable();
    queryElement<HTMLInputElement>(root, '#processing-showKalman-checkbox').click();
    await fixture.whenStable();
    expect(stream.observed).toBe(false);
    expect(root.querySelector('app-kalman-visualization')).toBeNull();
    expect(queryElement(root, '.motion-legend').textContent).not.toContain('Kalman track');
  });

  it('toggles the overlays independently and shows only the corresponding legend elements', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('kalmanEnabled', true);
    fixture.componentRef.setInput('predictionEnabled', true);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    stream.next([{ ...kalmanSample(), useVelocityPrediction: true }]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.kalman-track')).not.toBeNull();
    expect(root.querySelector('.linear.forecast')).not.toBeNull();
    expect(root.querySelector('.accelerated.forecast')).toBeNull();
    expect(root.querySelector('.prediction__canvas .measured')).toBeNull();
    queryElement<HTMLInputElement>(root, '#motion-display-settings-toggle').click();
    await fixture.whenStable();
    queryElement<HTMLInputElement>(root, '#processing-showPrediction-checkbox').click();
    await fixture.whenStable();
    expect(root.querySelector('.linear.forecast')).toBeNull();
    expect(root.querySelector('.kalman-track')).not.toBeNull();
    expect(queryElement(root, '.motion-legend').textContent).not.toContain('Linear forecast');
    expect(stream.observed).toBe(true);
    fixture.componentRef.setInput('kalmanEnabled', false);
    await fixture.whenStable();
    expect(queryElement<HTMLInputElement>(root, '#processing-showKalman-checkbox').disabled).toBe(true);
    expect(root.querySelector('.kalman-track')).toBeNull();
    expect(stream.observed).toBe(false);
  });
});
