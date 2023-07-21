import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NetworkInterface } from 'src/shared/config/networkInterface';
import { NetworkSettings } from 'src/shared/config/networkSettings';
import { NetworkingService } from 'src/shared/services/networking.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { LogService } from '../log/log.service';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html'
})
export class NetworkComponent implements OnInit, OnDestroy {

  public statusText = '';
  public errorText = '';

  public isBroadcasting = false;

  public networkInterfaces: Array<string> = [];
  public selectedInterfaceIdx = -1;

  public networkSettings: NetworkSettings = { networkInterfaceType: NetworkInterface.None, port: 0, endpoint: '', address: '', interval: 100 };

  private statusTextSubscription?: Subscription;
  private statusValuesSubscription?: Subscription;

  private settingsSubscription?: Subscription;

  public constructor(private readonly settingsService: SettingsService, private readonly networkService: NetworkingService, private readonly logService: LogService) {

  }

  public ngOnInit(): void {
    this.settingsSubscription = this.settingsService.getSettings().subscribe((result) => {
      this.networkSettings = result.networkSettingValues;
      this.fetchCurrentValues();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
    this.statusTextSubscription?.unsubscribe();
    this.statusValuesSubscription?.unsubscribe();
  }

  public fetchCurrentValues(): void {

    this.statusValuesSubscription = this.networkService.getStatusValues().subscribe((result) => {
      this.networkInterfaces = result.interfaces;
      this.networkSettings.address = result.address;
      this.networkSettings.port = result.port;
      this.networkSettings.endpoint = result.endpoint;
      this.updateInterfaceType(result.selectedInterface);
      this.isBroadcasting = result.isActive;
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });

    this.statusTextSubscription = this.networkService.getStatus()
      .subscribe((result) => {
        this.statusText = result;
      }, (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });
  }

  public isBroadcastingChanged(): void {
    this.errorText = '';
    this.networkService.toggleBroadcasting()
      .subscribe((result) => {
        console.log(`Networking status toggle - result:  ${result.status} - ${result.body?.value}`);
        this.isBroadcasting = result.body?.value as boolean;
      }, (error) => {
        this.isBroadcasting = false;
        this.errorText = `${error} - ${JSON.stringify(error, null, 3)}`;
        this.logService.sendErrorLog(this.errorText);
      });
  }

  public setNetworkInterface(): void {
    this.networkService.setNetworkInterface(this.networkInterfaces[this.selectedInterfaceIdx])
      .subscribe((result) => {
        console.log(`response to change NetworkInterface Type: ${result.status} - ${result.body?.value}`);
      }, (error: unknown) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });
  }

  public setAddress(): void {
    this.networkService.setAddress(this.networkSettings.address)
      .subscribe((result) => {
        console.log(`response to change address: ${result.status} - ${result.body?.value}`);
      }, (error: unknown) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });
  }

  public setPort(): void {
    this.networkService.setPort(this.networkSettings.port)
      .subscribe((result) => {
        console.log(`response to change port: ${result.status} - ${result.body?.value}`);
      }, (error: unknown) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });
  }

  public setEndpoint(): void {
    this.networkService.setEndpoint(this.networkSettings.endpoint)
      .subscribe((result) => {
        console.log(`response to change endpoint: ${result.status} - ${result.body?.value}`);
      }, (error: unknown) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });
  }

  public setInterval(): void {
    // Todo: implement on server side
  }

  public saveNetworkSettings(): void {
    this.networkService.saveSettings()
      .subscribe(() => {
      }, (error) => {
        this.errorText = `Cannot save settings: ${error} - ${JSON.stringify(error, null, 3)}`;
        this.logService.sendErrorLog(this.errorText);
      });
  }

  public updateInterfaceType(idx: number): void {
    this.selectedInterfaceIdx = idx;
    if (this.networkSettings) {
      this.networkSettings.networkInterfaceType = idx as NetworkInterface;
    }
  }
}
