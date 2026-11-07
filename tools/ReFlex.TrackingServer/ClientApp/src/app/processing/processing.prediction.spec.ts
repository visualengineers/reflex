import { By } from '@angular/platform-browser';
import { queryElement } from '../../../../../../test/helpers/dom';
import { DEFAULT_SETTINGS } from '@reflex/shared-types';
import { Subject, of, throwError } from 'rxjs';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import { MockInteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component.mock';
import { component as testComponent, fixture as testFixture, setupTests } from './processing.component.test-context';
import { processingService, settingsService } from './processing.component.test-data';

describe('Prediction options in ProcessingComponent', () => {
  setupTests();

  it('loads prediction settings and toggles the visualization independently of contact assignment', async () => {
    const saved = { ...testComponent.predictionSettings, useVelocityPrediction: false, predictionHorizonSeconds: 0.12 };
    settingsService.getSettings.mockReturnValue(of({ ...DEFAULT_SETTINGS, predictionSettings: saved }));
    testFixture.detectChanges();
    await testFixture.whenStable();
    expect(testComponent.predictionSettings).toEqual(saved);
    expect(testComponent.forecastMilliseconds).toBe(120);
    expect(settingsService.update).toHaveBeenCalledOnce();
    const root = testFixture.nativeElement as HTMLElement;
    const checkbox = queryElement<HTMLInputElement>(root, '#processing-showPrediction-checkbox');
    const visualization = testFixture.debugElement.query(By.directive(MockInteractionsVisualizationComponent))
      .componentInstance as InteractionsVisualizationComponent;
    expect(checkbox.checked).toBe(true);
    expect(visualization.showPrediction).toBe(true);
    checkbox.click();
    await testFixture.whenStable();
    expect(testComponent.showPrediction).toBe(false);
    expect(visualization.showPrediction).toBe(false);
    expect(testComponent.predictionSettings.useVelocityPrediction).toBe(false);
    expect(processingService.setPredictionSettings).not.toHaveBeenCalled();
    expect(root.querySelector('app-prediction-panel')).toBeNull();
    expect(root.textContent).toContain('Matching target (current time)');
  });

  it('converts the forecast horizon to seconds and saves all prediction options', async () => {
    testFixture.detectChanges();
    testComponent.forecastMilliseconds = 250;
    testComponent.predictionSettings.numFramesForPrediction = 5;
    testComponent.predictionSettings.useSecondDerivation = true;
    const saved = { ...testComponent.predictionSettings };
    processingService.setPredictionSettings.mockReturnValue(of(saved));
    const button = Array.from((testFixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((element) => element.textContent?.includes('Apply and save prediction'));
    expect(button).toBeDefined();
    button?.click();
    await testFixture.whenStable();
    expect(saved.predictionHorizonSeconds).toBe(0.25);
    expect(processingService.setPredictionSettings).toHaveBeenCalledWith(saved);
    expect(testComponent.predictionMessage).toBe('Prediction settings saved.');
  });

  it('reports prediction settings load and save failures', () => {
    settingsService.getSettings.mockReturnValue(throwError(() => new Error('load failed')));
    testFixture.detectChanges();
    expect(testComponent.predictionMessage).toBe('Could not load prediction settings.');
    processingService.setPredictionSettings.mockReturnValue(throwError(() => new Error('save failed')));
    testComponent.savePrediction();
    expect(testComponent.predictionMessage).toContain('Could not save.');
  });

  it('unsubscribes prediction settings and pending saves on destruction', () => {
    const settings = new Subject<typeof DEFAULT_SETTINGS>();
    const save = new Subject<NonNullable<typeof DEFAULT_SETTINGS.predictionSettings>>();
    settingsService.getSettings.mockReturnValue(settings);
    processingService.setPredictionSettings.mockReturnValue(save);
    testFixture.detectChanges();
    testComponent.savePrediction();
    expect(settings.observed).toBe(true);
    expect(save.observed).toBe(true);
    testFixture.destroy();
    expect(settings.observed).toBe(false);
    expect(save.observed).toBe(false);
  });

});
