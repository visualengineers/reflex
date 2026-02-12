import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGroupComponent, OptionCheckboxComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from '../service/configuration.service';
import { CircleSize } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { Subscription } from 'rxjs';
import { OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-recorderoptions',
    imports: [CommonModule, FormsModule, SettingsGroupComponent, OptionCheckboxComponent, ValueTextComponent],
    templateUrl: './recorderoptions.component.html',
    styleUrl: './recorderoptions.component.scss'
})
export class RecorderoptionsComponent implements OnInit, OnDestroy{
  public amountTouchPoints: number = 0;
  public circleSize: CircleSize = { min: 0, max: 0 };
  public sendInterval: number = 100;
  public serverConnection?: string;

  private amountTouchPointsSubscription?: Subscription;

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService,
  ) {}

  ngOnInit(): void {
      this.circleSize = this.configurationService.getCircleSize();
      this.sendInterval = this.configurationService.getSendInterval();
      this.serverConnection = this.configurationService.getServerConnection();

      this.amountTouchPointsSubscription = this.configurationService.getAmountTouchPoints()
        .subscribe(amount => this.amountTouchPoints = amount);
  }

  saveConfiguration(): void {
    this.configurationService.setAmoutTouchPoints(this.amountTouchPoints);
    this.configurationService.setCircleSize(this.circleSize);
    this.configurationService.setSendInterval(this.sendInterval);
    if (this.serverConnection !== undefined) {
      this.configurationService.setServerConnection(this.serverConnection);
    }
    this.configurationService.setLocalStorage();
    this.connectionService.reconnect();
  }

  restoreConfiguration(): void {
    this.configurationService.getLocalStorage();
    this.ngOnInit();
  }

  connectToServer(): void {
    this.connectionService.init();
  }

  ngOnDestroy(): void {
    this.connectionService.disconnect();
    this.amountTouchPointsSubscription?.unsubscribe();
  }
}
