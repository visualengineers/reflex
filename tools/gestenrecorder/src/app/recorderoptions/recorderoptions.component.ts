import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  OptionCheckboxComponent,
  SettingsGroupComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { Subscription } from 'rxjs';
import { CircleSize, ConfigurationService } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';

@Component({
  selector: 'app-recorderoptions',
  imports: [
    FormsModule,
    SettingsGroupComponent,
    OptionCheckboxComponent,
    ValueTextComponent
  ],
  templateUrl: './recorderoptions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './recorderoptions.component.scss'
})
export class RecorderoptionsComponent implements OnInit, OnDestroy {

  public amountTouchPoints = 0;
  public circleSize: CircleSize = { min: 0, max: 0 };
  public sendInterval = 100;
  public serverConnection?: string;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly configurationService = inject(ConfigurationService);
  private readonly connectionService = inject(ConnectionService);

  private amountTouchPointsSubscription?: Subscription;

  public ngOnInit(): void {
    this.circleSize = this.configurationService.getCircleSize();
    this.sendInterval = this.configurationService.getSendInterval();
    this.serverConnection = this.configurationService.getServerConnection();

    this.amountTouchPointsSubscription = this.configurationService
      .getAmountTouchPoints()
      .subscribe((amount) => {
        this.amountTouchPoints = amount;
        this.changeDetector.markForCheck();
      });
  }

  public saveConfiguration(): void {
    this.configurationService.setAmoutTouchPoints(this.amountTouchPoints);
    this.configurationService.setCircleSize(this.circleSize);
    this.configurationService.setSendInterval(this.sendInterval);
    if (this.serverConnection !== undefined) {
      this.configurationService.setServerConnection(this.serverConnection);
    }
    this.configurationService.setLocalStorage();
    this.connectionService.reconnect();
  }

  public restoreConfiguration(): void {
    this.configurationService.getLocalStorage();
    this.ngOnInit();
  }

  public connectToServer(): void {
    this.connectionService.init();
  }

  public ngOnDestroy(): void {
    this.connectionService.disconnect();
    this.amountTouchPointsSubscription?.unsubscribe();
  }
}
