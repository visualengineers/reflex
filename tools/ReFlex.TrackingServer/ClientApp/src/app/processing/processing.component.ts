import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NEVER, Observable, Subscription } from 'rxjs';
import { concatMap, tap, startWith, switchMap, map } from 'rxjs/operators';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { LogService } from '../log/log.service';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import { InteractionsComponent } from './interactions/interactions.component';
import { CompleteInteractionData, DEFAULT_SETTINGS, Interaction, ObserverType, ProcessingSettings, RemoteProcessingServiceSettings, TrackingServerAppSettings } from '@reflex/shared-types';

@Component({
    selector: 'app-processing',
    templateUrl: './processing.component.html',
    styleUrls: ['./processing.component.scss'],
    standalone: false
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

  public remoteSettings: RemoteProcessingServiceSettings = DEFAULT_SETTINGS.remoteProcessingServiceSettingsValues;
  public remoteAddress = '';
  public remotePort = 0;

  public processingSettings: ProcessingSettings = {
    interactionType: ObserverType.None,
    intervalDuration: 0
  };

  private selectedProcessorSubscription?: Subscription;
  private intervalSubscription?: Subscription;
  private interactionsSubscription?: Subscription;
  private observerSubscription?: Subscription;
  private remoteSettingsSubscription?: Subscription;
  private saveSettingsSubscription?: Subscription;

  // private readonly settingsSubscription?: Subscription;
  private statusSubscription?: Subscription;

  private readonly saveSettings$: Observable<TrackingServerAppSettings>;

  public constructor(
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly settingsService: SettingsService,
    private readonly processingService: ProcessingService,
    private readonly calibrationService: CalibrationService,
    private readonly logService: LogService
  ) {

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

    this.statusSubscription = this.processingService.getStatus().subscribe(
      (result) => {
        this.statusText = result;
      },
      (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }
    );

    this.observerSubscription = this.processingService.getObserverTypes()
      .subscribe(
        (result) => {
          this.processors = result;
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.selectedProcessorSubscription = this.processingService.getSelectedObserverType()
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
    this.interactionsSubscription = this.processingService.getStatus()
      .pipe(
        tap((processing) => {
          this.isInteractionProcessingActive = processing === 'Active';
          this.updateStatusText();
        }),
        switchMap((processing) => processing ? interactions$ : NEVER.pipe<Array<Interaction>>(startWith([]))),
        concatMap((raw) => this.calibrationService.computeCalibratedAbsolutePosition(raw))
      )
      .subscribe(
        (result) => this.updateInteractions(result),
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.intervalSubscription = this.processingService.getInterval()
      .subscribe(
        (result) => {
          this.updateInterval(result);
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );

    this.remoteSettingsSubscription = this.processingService.getRemoteProcessorSettings()
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
    this.processingService.toggleProcessing()
      .subscribe((result) => {
        console.log(`Processing status toggle - result:  ${result.status} - ${result.body?.value}`);
        this.isInteractionProcessingActive = result.body?.value as boolean;

      }, (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });
  }

  public setProcessor(): void {
    this.processingService.setObserverType(this.processors[this.selectedProcessorIdx]).subscribe((result) => {
      console.log(`response to change Observer Type: ${result.status} - ${result.body?.value}`);
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public setInterval(): void {
    this.processingService.setInterval(this.interval).subscribe((result) => {
      console.log(`Response to change interval request: ' + ${result.status} - Value: ${result.body?.value}`);
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public setAddress(): void {
    this.updateAddress();
  }

  public setPort(): void {
    this.updateAddress();
  }

  public updateAddress(): void {
    const completeAddress = `${this.remoteAddress}:${this.remotePort}`;
    try {
      const url = new URL(completeAddress);
      if (url) {
        this.remoteSettings.address = completeAddress;
        this.updateSettings();
      }
    } catch (exc) {
      console.warn(`Invalid URL: ${completeAddress}`);
    }
  }

  public updateSettings(): void {
    this.processingService.setRemoteProcessorSettings(this.remoteSettings).subscribe((result) => {
      console.log(`Response to set remote processing settings request: ' + ${result.status} - Value: ${JSON.stringify(result.body)}`);
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveRemoteProcessingSettings(): void {
    this.saveSettingsSubscription = this.saveSettings$.subscribe(
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
    this.statusText = this.isInteractionProcessingActive ? 'Active' : 'Inactive';
  }

  private updateProcessor(idx: number): void {
    this.selectedProcessorIdx = idx;
    if (this.processingSettings) {
      this.processingSettings.interactionType = idx as ObserverType;
    }
  }

  private updateInterval(interval: number): void {
    if (this.processingSettings) {
      this.processingSettings.intervalDuration = interval;
    }
    this.interval = interval;
  }

  private updateInteractions(interactions: CompleteInteractionData): void {
    this.eventId++;

    this.interactionsList?.updateInteractions(interactions);
    this.visualization?.updateCalibratedInteractions(interactions);
  }

  private updateRemoteSettings(settings: RemoteProcessingServiceSettings): void {
    this.remoteSettings = settings;

    const url = new URL(this.remoteSettings.address);
    this.remoteAddress = `${url.protocol}//${url.hostname}`;
    this.remotePort = Number.parseFloat(url.port);
  }
}
