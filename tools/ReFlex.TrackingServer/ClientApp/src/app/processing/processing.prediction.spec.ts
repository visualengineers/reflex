import { DEFAULT_SETTINGS, InteractionVelocity } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { mount, processing, settings, setupTests } from '../test-utils/zoneless-change-detection.test-context';
import { PredictionPanelComponent } from './prediction-panel/prediction-panel.component';

describe('Prediction panel integration', () => {
  setupTests();
  it('opens the diagnostic stream lazily and unsubscribes when closed', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    settings.getSettings.mockReturnValue(of(structuredClone(DEFAULT_SETTINGS)));
    const fixture = await mount(PredictionPanelComponent);
    expect(processing.getVelocities.mock.calls).toHaveLength(0);
    fixture.componentInstance.togglePrediction();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(stream.observed).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Position prediction');
    fixture.componentInstance.togglePrediction();
    expect(stream.observed).toBe(false);
    fixture.destroy();
  });

  it('saves the selected model and clears diagnostics when prediction is disabled', async () => {
    const fixture = await mount(PredictionPanelComponent);
    const config = { useVelocityPrediction: false, numFramesForPrediction: 4, useSecondDerivation: true, secondDerivationMagnitude: 0.5 };
    processing.setPredictionSettings.mockReturnValue(of(config));
    fixture.componentInstance.predictionSettings = config;
    fixture.componentInstance.savePrediction();
    await fixture.whenStable();
    expect(processing.setPredictionSettings.mock.calls).toEqual([[config]]);
    expect(fixture.componentInstance.predictionData).toEqual([]);
    expect(fixture.componentInstance.predictionMessage).toContain('saved');
  });
});
