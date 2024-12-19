import { Component, OnDestroy, OnInit } from '@angular/core';
import { LogService } from 'src/app/log/log.service';
import { TuioService } from 'src/shared/services/tuio.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { Subscription } from 'rxjs';
import { DEFAULT_SETTINGS, ProtocolVersion, TransportProtocol, TuioConfiguration, TuioInterpretation } from '@reflex/shared-types';

@Component({
    selector: 'app-tuio',
    templateUrl: './tuio.component.html',
    standalone: false
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

  private statusTextSubscription?: Subscription;
  private settingsSubscription?: Subscription;

  public constructor(private readonly settingsService: SettingsService, private readonly tuioService: TuioService, private readonly logService: LogService) { }

  public ngOnInit(): void {
    this.settingsSubscription = this.settingsService.getSettings().subscribe((result) => {
      if (result.tuioSettingValues) {
        this.config = result.tuioSettingValues;
        this.transportProtocolIdx = this.config.transport;
        this.tuioProtocolVersionIdx = this.config.protocol;
        this.tuioInterpretationIdx = this.config.interpretation;
        this.serverAddress = this.config.serverAddress;
        this.serverPort = this.config.serverPort;
      }
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.settingsService.update();

    this.fetchCurrentValues();
  }

  public ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
    this.statusTextSubscription?.unsubscribe();
  }

  public fetchCurrentValues(): void {

    this.tuioService.getIsBroadcasting().subscribe((result) => {
      if (result.body?.name === 'IsBroadcasting') {
        this.isBroadcasting = result.body.value === true;
      }
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.tuioService.getTransportProtocols().subscribe((result) => {
      this.transportProtocols = result;
      if (this.config) {
        this.transportProtocolIdx = this.config.transport as number;
      }
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.tuioService.getTuioProtocolVersions().subscribe((result) => {
      this.tuioProtocolVersions = result;
      if (this.config) {
        this.tuioProtocolVersionIdx = this.config.protocol as number;
      }
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.tuioService.getTuioInterpretations().subscribe((result) => {
      this.tuioInterpretations = result;
      if (this.config) {
        this.tuioInterpretationIdx = this.config.interpretation as number;
      }
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.statusTextSubscription = this.tuioService.getStatus().subscribe((result) => {
      this.statusText = result;
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public setAddress(): void {
    this.config.serverAddress = this.serverAddress;
    this.tuioService.setAddress(this.config.serverAddress).subscribe((result) => {
      console.log(`response to change TUIO server address: ${result.status} - ${result.body?.value}`);
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public setPort(): void {
    this.config.serverPort = this.serverPort;
    this.tuioService.setPort(this.config.serverPort).subscribe((result) => {
      console.log(`response to change TUIO server port: ${result.status} - ${result.body?.value}`);
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public setTransportProtocol(): void {
    this.tuioService.setTransportProtocol(this.transportProtocols[this.transportProtocolIdx]).subscribe((result) => {
      console.log(`response to change TUIO transport protocol: ${result.status} - ${result.body?.value}`);
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public updateTransportProtocol(idx: number): void {
    this.transportProtocolIdx = idx;
    if (this.config) {
      this.config.transport = idx as TransportProtocol;
    }
  }

  public setTuioProtocolVersion(): void {
    this.tuioService.setTuioProtocolVersion(this.tuioProtocolVersions[this.tuioProtocolVersionIdx]).subscribe((result) => {
      console.log(`response to change TUIO protocol version: ${result.status} - ${result.body?.value}`);
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public updateTuioProtocolVersion(idx: number): void {
    this.tuioProtocolVersionIdx = idx;
    if (this.config) {
      this.config.protocol = idx as ProtocolVersion;
    }
  }

  public setTuioInterpretation(): void {
    this.tuioService.setTuioInterpretation(this.tuioInterpretations[this.tuioInterpretationIdx]).subscribe((result) => {
      console.log(`response to change TUIO interpretation: ${result.status} - ${result.body?.value}`);
    }, (error) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public updateTuioInterpretation(idx: number): void {
    this.tuioInterpretationIdx = idx;
    if (this.config) {
      this.config.interpretation = idx as TuioInterpretation;
    }
  }

  public isBroadcastingChanged(): void {
    this.errorText = '';
    this.tuioService.toggleBroadcasting()
      .subscribe((result) => {
        console.log(`Tuio Broadcast status toggle - result:  ${result.status} - ${result.body?.value}`);
        this.isBroadcasting = result.body?.value as boolean;
      }, (error) => {
        this.isBroadcasting = false;
        this.errorText = `${error} - ${JSON.stringify(error, null, 3)}`;
        this.logService.sendErrorLog(this.errorText);
      });
  }

  public saveTuioConfig(): void {
    this.tuioService.saveSettings()
      .subscribe(() => {
      }, (error) => {
        this.errorText = `Cannot save settings: ${error} - ${JSON.stringify(error, null, 3)}`;
        this.logService.sendErrorLog(this.errorText);
      });
  }

  public isConfigValid(): boolean {
    return this.config != null
      && typeof this.config.serverAddress === 'string' && this.config.serverAddress.trim() !== ''
      && this.config.serverPort > 0
      && this.transportProtocolIdx >= 0
      && this.tuioInterpretationIdx >= 0
      && this.tuioProtocolVersionIdx >= 0;
  }
}
