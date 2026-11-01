import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InteractionVelocity, PredictionSettings } from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { InteractionsVelocityVisualizationComponent } from '../interactions-velocity-visualization/interactions-velocity-visualization.component';

@Component({
  selector: 'app-prediction-panel',
  imports: [CommonModule, FormsModule, InteractionsVelocityVisualizationComponent],
  templateUrl: './prediction-panel.component.html',
  styleUrl: './prediction-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PredictionPanelComponent implements OnChanges, OnDestroy {
  @Input() public isProcessing = false;
  public showPrediction = false;
  public predictionData: Array<InteractionVelocity> = [];
  public predictionSettings: PredictionSettings = {
    useVelocityPrediction: true,
    numFramesForPrediction: 3,
    useSecondDerivation: false,
    secondDerivationMagnitude: 0.5
  };

  public predictionMessage = '';
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly settingsService = inject(SettingsService);
  private readonly processingService = inject(ProcessingService);
  private predictionSubscription?: Subscription;
  private predictionSettingsSubscription?: Subscription;
  private predictionSaveSubscription?: Subscription;

  public ngOnChanges(): void {
    if (!this.isProcessing) {
      this.predictionData = [];
    }
  }

  public ngOnDestroy(): void {
    this.predictionSubscription?.unsubscribe();
    this.predictionSettingsSubscription?.unsubscribe();
    this.predictionSaveSubscription?.unsubscribe();
  }

  public togglePrediction(): void {
    this.showPrediction = !this.showPrediction;
    this.predictionSubscription?.unsubscribe();
    this.predictionSettingsSubscription?.unsubscribe();
    this.predictionData = [];
    if (!this.showPrediction) {
      return;
    }
    this.predictionSettingsSubscription = this.settingsService.getSettings()
      .pipe(markViewForCheck(this.changeDetector)).subscribe({
        next: (settings) => {
          this.predictionSettings = { ...this.predictionSettings, ...settings.predictionSettings };
        },
        error: () => {
          this.predictionMessage = 'Could not load prediction settings.';
        }
      });
    this.settingsService.update();
    this.predictionSubscription = this.processingService.getVelocities().pipe(markViewForCheck(this.changeDetector)).subscribe({
      next: (data) => {
        this.predictionData = data;
      },
      error: () => {
        this.predictionMessage = 'Prediction stream disconnected.';
        this.predictionData = [];
      }
    });
  }

  public savePrediction(): void {
    this.predictionSaveSubscription?.unsubscribe();
    this.predictionSaveSubscription = this.processingService.setPredictionSettings(this.predictionSettings)
      .pipe(markViewForCheck(this.changeDetector)).subscribe({
        next: (settings) => {
          this.predictionSettings = settings;
          this.predictionMessage = 'Prediction settings saved.';
          if (!settings.useVelocityPrediction) {
            this.predictionData = [];
          }
        },
        error: () => {
          this.predictionMessage = 'Could not save. Use at least 2 samples and an acceleration weight from 0 to 1.';
        }
      });
  }

}
