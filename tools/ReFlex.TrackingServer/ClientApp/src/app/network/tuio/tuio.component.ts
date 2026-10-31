import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { LogService } from 'src/app/log/log.service';
import { TuioService } from 'src/shared/services/tuio.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { Subscription } from 'rxjs';
import {
  DEFAULT_SETTINGS,
  TuioConfiguration
} from '@reflex/shared-types';
import {
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PackageDetailsComponent } from './package-details/package-details.component';

@Component({
  selector: 'app-tuio',
  templateUrl: './tuio.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    PanelHeaderComponent,
    ValueSelectionComponent,
    ValueTextComponent,
    PackageDetailsComponent
  ]
})
export class TuioComponent implements OnInit, OnDestroy {

  public statusText = '';
  public errorText = '';

  public isBroadcasting = false;

  public transportProtocols: Array<string> = [];
  public transportProtocolIdx = -1;

  public tuioProtocolVersions: Array<string> = [];
  public tuioProtocolVersionIdx = -1;

  public tuioInterpretations: Array<string> = [];
  public tuioInterpretationIdx = -1;

  public config: TuioConfiguration = DEFAULT_SETTINGS.tuioSettingValues;

  public serverAddress = '';
  public serverPort = 0;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly settingsService = inject(SettingsService);
  private readonly tuioService = inject(TuioService);
  private readonly logService = inject(LogService);

  private statusTextSubscription?: Subscription;
  private settingsSubscription?: Subscription;

  public ngOnInit(): void {
    this.settingsSubscription = this.settingsService
      .getSettings()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          if (result.tuioSettingValues !== undefined && result.tuioSettingValues !== null) {
            this.config = result.tuioSettingValues;
            this.transportProtocolIdx = this.config.transport;
            this.tuioProtocolVersionIdx = this.config.protocol;
            this.tuioInterpretationIdx = this.config.interpretation;
            this.serverAddress = this.config.serverAddress;
            this.serverPort = this.config.serverPort;
          }
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );

    this.settingsService.update();

    this.fetchCurrentValues();
  }

  public ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
    this.statusTextSubscription?.unsubscribe();
  }

  public fetchCurrentValues(): void {
    this.tuioService
      .getIsBroadcasting()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          if (result.body?.name === 'IsBroadcasting') {
            this.isBroadcasting = result.body.value === true;
          }
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );

    this.tuioService
      .getTransportProtocols()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.transportProtocols = result;
          if (this.config !== undefined && this.config !== null) {
            this.transportProtocolIdx = this.config.transport;
          }
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );

    this.tuioService
      .getTuioProtocolVersions()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.tuioProtocolVersions = result;
          if (this.config !== undefined && this.config !== null) {
            this.tuioProtocolVersionIdx = this.config.protocol;
          }
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );

    this.tuioService
      .getTuioInterpretations()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.tuioInterpretations = result;
          if (this.config !== undefined && this.config !== null) {
            this.tuioInterpretationIdx = this.config.interpretation;
          }
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );

    this.statusTextSubscription = this.tuioService
      .getStatus()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.statusText = result;
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public setAddress(): void {
    this.config.serverAddress = this.serverAddress;
    this.tuioService
      .setAddress(this.config.serverAddress)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `response to change TUIO server address: ${result.status} - ${result.body?.value}`
          );
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public setPort(): void {
    this.config.serverPort = this.serverPort;
    this.tuioService
      .setPort(this.config.serverPort)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `response to change TUIO server port: ${result.status} - ${result.body?.value}`
          );
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public setTransportProtocol(): void {
    this.tuioService
      .setTransportProtocol(this.transportProtocols[this.transportProtocolIdx])
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `response to change TUIO transport protocol: ${result.status} - ${result.body?.value}`
          );
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public updateTransportProtocol(idx: number): void {
    this.transportProtocolIdx = idx;
    if (this.config !== undefined && this.config !== null) {
      this.config.transport = idx;
    }
  }

  public setTuioProtocolVersion(): void {
    this.tuioService
      .setTuioProtocolVersion(
        this.tuioProtocolVersions[this.tuioProtocolVersionIdx]
      )
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `response to change TUIO protocol version: ${result.status} - ${result.body?.value}`
          );
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public updateTuioProtocolVersion(idx: number): void {
    this.tuioProtocolVersionIdx = idx;
    if (this.config !== undefined && this.config !== null) {
      this.config.protocol = idx;
    }
  }

  public setTuioInterpretation(): void {
    this.tuioService
      .setTuioInterpretation(
        this.tuioInterpretations[this.tuioInterpretationIdx]
      )
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `response to change TUIO interpretation: ${result.status} - ${result.body?.value}`
          );
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public updateTuioInterpretation(idx: number): void {
    this.tuioInterpretationIdx = idx;
    if (this.config !== undefined && this.config !== null) {
      this.config.interpretation = idx;
    }
  }

  public isBroadcastingChanged(): void {
    this.errorText = '';
    this.tuioService
      .toggleBroadcasting()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          console.log(
            `Tuio Broadcast status toggle - result:  ${result.status} - ${result.body?.value}`
          );
          this.isBroadcasting = result.body?.value as boolean;
        },
        (error) => {
          this.isBroadcasting = false;
          this.errorText = `${error} - ${JSON.stringify(error, null, 3)}`;
          this.logService.sendErrorLog(this.errorText);
        }
      );
  }

  public saveTuioConfig(): void {
    this.tuioService
      .saveSettings()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        () => {},
        (error) => {
          this.errorText = `Cannot save settings: ${error} - ${JSON.stringify(
            error,
            null,
            3
          )}`;
          this.logService.sendErrorLog(this.errorText);
        }
      );
  }

  public isConfigValid(): boolean {
    return (
      this.config != null
      && typeof this.config.serverAddress === 'string'
      && this.config.serverAddress.trim() !== ''
      && this.config.serverPort > 0
      && this.transportProtocolIdx >= 0
      && this.tuioInterpretationIdx >= 0
      && this.tuioProtocolVersionIdx >= 0
    );
  }
}
