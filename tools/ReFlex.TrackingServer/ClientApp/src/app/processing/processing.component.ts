import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  OptionCheckboxComponent,
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueSliderComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import {
  CompleteInteractionData,
  DEFAULT_SETTINGS,
  Interaction,
  ObserverType,
  ProcessingSettings,
  RemoteProcessingServiceSettings,
  TrackingServerAppSettings
} from '@reflex/shared-types';
import { NEVER, Observable, Subscription } from 'rxjs';
import { concatMap, map, startWith, switchMap, tap } from 'rxjs/operators';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { LogService } from '../log/log.service';
import { PredictionPanelComponent } from './prediction-panel/prediction-panel.component';
import { HistoryComponent } from './history/history.component';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import { InteractionsComponent } from './interactions/interactions.component';

@Component({
  selector: 'app-processing',
  templateUrl: './processing.component.html',
  styleUrls: ['./processing.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    PanelHeaderComponent,
    ValueSelectionComponent,
    ValueSliderComponent,
    ValueTextComponent,
    OptionCheckboxComponent,
    InteractionsComponent,
    HistoryComponent,
    InteractionsVisualizationComponent,
    PredictionPanelComponent
  ]
})
export class ProcessingComponent implements OnInit, OnDestroy {

  @ViewChild('visualizationContainer')
  public visualization?: InteractionsVisualizationComponent;

  @ViewChild('interactionsList')
  public interactionsList?: InteractionsComponent;

  public statusText = '';
  public eventId = 0;

  public selectedProcessorIdx = -1;
  public interval = 0;

  public processors: Array<string> = [];

  public isInteractionProcessingActive = false;

  public remoteSettings: RemoteProcessingServiceSettings = {
    ...DEFAULT_SETTINGS.remoteProcessingServiceSettingsValues
  };

  public remoteAddress = '';
  public remotePort = 0;

  public processingSettings: ProcessingSettings = {
    interactionType: ObserverType.None,
    intervalDuration: 0
  };

  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly baseUrl = inject(BASE_URL);
  private readonly settingsService = inject(SettingsService);
  private readonly processingService = inject(ProcessingService);
  private readonly calibrationService = inject(CalibrationService);
  private readonly logService = inject(LogService);

  private selectedProcessorSubscription?: Subscription;
  private intervalSubscription?: Subscription;
  private interactionsSubscription?: Subscription;
  private observerSubscription?: Subscription;
  private remoteSettingsSubscription?: Subscription;
  private saveSettingsSubscription?: Subscription;

  // private readonly settingsSubscription?: Subscription;
  private statusSubscription?: Subscription;

  private readonly saveSettings$: Observable<TrackingServerAppSettings>;

  public constructor() {
    this.saveSettings$ = this.settingsService.getSettings().pipe(
      map((result) => {
        const settings = result;
        result.remoteProcessingServiceSettingsValues = this.remoteSettings;

        return settings;
      }),
      tap((updatedSettings: TrackingServerAppSettings) => {
        this.settingsService.saveSettings(updatedSettings);
      })
    );
  }

  public ngOnInit(): void {
    this.statusSubscription = this.processingService
      .getStatus()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.statusText = result;
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.observerSubscription = this.processingService
      .getObserverTypes()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.processors = result;
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.selectedProcessorSubscription = this.processingService
      .getSelectedObserverType()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.updateProcessor(result);
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    const interactions$ = this.processingService.getInteractions();
    this.interactionsSubscription = this.processingService
      .getStatus()
      .pipe(
        tap((processing) => {
          this.isInteractionProcessingActive = processing === 'Active';
          this.updateStatusText();
        }),
        switchMap((processing) =>
          processing
            ? interactions$
            : NEVER.pipe<Array<Interaction>>(startWith([]))),
        concatMap((raw) =>
          this.calibrationService.computeCalibratedAbsolutePosition(raw))
      )
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => this.updateInteractions(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.intervalSubscription = this.processingService
      .getInterval()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.updateInterval(result);
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.remoteSettingsSubscription = this.processingService
      .getRemoteProcessorSettings()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.updateRemoteSettings(result);
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
    this.selectedProcessorSubscription?.unsubscribe();
    this.intervalSubscription?.unsubscribe();
    this.interactionsSubscription?.unsubscribe();
    this.observerSubscription?.unsubscribe();
    this.remoteSettingsSubscription?.unsubscribe();
    this.saveSettingsSubscription?.unsubscribe();
  }

  public isInteractionProcessingActiveChanged(): void {
    this.processingService
      .toggleProcessing()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `Processing status toggle - result:  ${result.status} - ${result.body?.value}`
          );
          this.isInteractionProcessingActive = result.body?.value as boolean;
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public setProcessor(): void {
    this.processingService
      .setObserverType(this.processors[this.selectedProcessorIdx])
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `response to change Observer Type: ${result.status} - ${result.body?.value}`
          );
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public setInterval(): void {
    this.processingService
      .setInterval(this.interval)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `Response to change interval request: ' + ${result.status} - Value: ${result.body?.value}`
          );
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public setAddress(): void {
    this.updateAddress();
  }

  public setPort(): void {
    this.updateAddress();
  }

  public updateAddress(): void {
    const completeAddress = `${this.remoteAddress}:${this.remotePort}`;
    if (!URL.canParse(completeAddress)) {
      console.warn(`Invalid URL: ${completeAddress}`);

      return;
    }

    this.remoteSettings.address = completeAddress;
    this.updateSettings();
  }

  public updateSettings(): void {
    this.processingService
      .setRemoteProcessorSettings(this.remoteSettings)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `Response to set remote processing settings request: ' + ${
              result.status
            } - Value: ${JSON.stringify(result.body)}`
          );
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public saveRemoteProcessingSettings(): void {
    this.saveSettingsSubscription = this.saveSettings$
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(`saved settings:  ${JSON.stringify(result)}`);
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  private updateStatusText(): void {
    this.statusText = this.isInteractionProcessingActive
      ? 'Active'
      : 'Inactive';
  }

  private updateProcessor(idx: number): void {
    this.selectedProcessorIdx = idx;
    if (this.processingSettings !== undefined && this.processingSettings !== null) {
      this.processingSettings.interactionType = idx;
    }
  }

  private updateInterval(interval: number): void {
    if (this.processingSettings !== undefined && this.processingSettings !== null) {
      this.processingSettings.intervalDuration = interval;
    }
    this.interval = interval;
  }

  private updateInteractions(interactions: CompleteInteractionData): void {
    this.eventId++;

    this.interactionsList?.updateInteractions(interactions);
    this.visualization?.updateCalibratedInteractions(interactions);
  }

  private updateRemoteSettings(
    settings: RemoteProcessingServiceSettings
  ): void {
    this.remoteSettings = {
      ...settings,
      useGzipCompression: settings.useGzipCompression ?? true
    };

    const url = new URL(this.remoteSettings.address);
    this.remoteAddress = `${url.protocol}//${url.hostname}`;
    this.remotePort = Number.parseFloat(url.port);
  }
}
