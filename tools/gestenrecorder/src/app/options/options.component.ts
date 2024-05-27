import { Component, Renderer2 } from '@angular/core';
import { ConfigurationService } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { OnInit, OnDestroy } from '@angular/core';
import { BackgroundSource } from '../model/BackgroundSource.model';
import { Camera, CircleSize, Layers, ViewPort, ViewOption } from '../service/configuration.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ViewChild, ElementRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss'
})
export class OptionsComponent implements OnInit, OnDestroy {
  public showTracking = true;
  public showProjection = false;
  public backupTimestamp: Date | null = new Date();
  public backgroundType = 0; // 0: none | 1: from 'assets/img' | 2: url
  public amountProjectionLayers: number = 0;
  public amountTouchPoints: number = 0;
  public backgroundImage: string = '';
  public backgroundSources: BackgroundSource[] = [];
  public backgroundUrl: string = '';
  public circleSize: CircleSize = { min: 0, max: 0 };
  public layers: Layers = {
    up: 0,
    down: 0,
    colorUp: '',
    colorDown: ''
  };
  public viewPort: ViewPort = {
    width: 0,
    height: 0
  };
  public sendInterval: number = 100;
  public serverConnection?: string;
  public viewOptions: Array<ViewOption> = [];

  private amountTouchPointsSubscription?: Subscription;
  private layersSubscription?: Subscription;
  private stateSubscription?: Subscription;

  @ViewChild('indicator')
  private indicator?: ElementRef;

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
      this.connectionService.init();

      this.amountProjectionLayers = this.configurationService.getAmountProjectionLayers();
      this.backgroundSources = this.configurationService.getBackgroundSources();
      this.circleSize = this.configurationService.getCircleSize();
      this.sendInterval = this.configurationService.getSendInterval();
      this.serverConnection = this.configurationService.getServerConnection();
      this.viewOptions = this.configurationService.getViewOptions();
      this.viewPort = this.configurationService.getViewPort();

      this.amountTouchPointsSubscription = this.configurationService.getAmountTouchPoints()
        .subscribe(amount => this.amountTouchPoints = amount);

      this.layersSubscription = this.configurationService.getLayers()
        .subscribe(layers => this.layers = layers );

      this.stateSubscription = this.connectionService.connectionSuccessful.subscribe(result => this.onWebSocketConnectionStateChanged(result));
  }

  onWebSocketConnectionStateChanged(state: boolean) {
    if (state === true) {
      this.renderer.addClass(this.indicator?.nativeElement, 'success');
      this.renderer.removeClass(this.indicator?.nativeElement, 'error');
    } else {
      this.renderer.addClass(this.indicator?.nativeElement, 'error');
      this.renderer.removeClass(this.indicator?.nativeElement, 'success');
    }
  }

  saveConfiguration(): void {
    this.configurationService.setAmountProjectionLayers(this.amountProjectionLayers);
    this.configurationService.setAmountProjectionLayers(this.amountTouchPoints);
    this.configurationService.setCircleSize(this.circleSize);

    if (this.layers !== undefined) {
      this.configurationService.setLayers(this.layers);
    }
    this.configurationService.setSendInterval(this.sendInterval);

    if (this. serverConnection !== undefined) {
      this.configurationService.setServerConnection(this.serverConnection);
    }

    if (this.viewPort !== undefined) {
      this.configurationService.setViewPort(this.viewPort);
    }
    this.configurationService.setViewOptions(this.viewOptions);
    console.log(this.viewOptions);

    this.configurationService.setLocalStorage();

    this.connectionService.reconnect();
  }

  // TODO: load a background image (i think the the touch area is not loading the image)
  onBackgroundSelected(): void {
    switch (this.backgroundType) {
      case 1: {
        this.configurationService.setBackgroundImage(this.backgroundImage);
        break;
      }
      case 2: {
        this.configurationService.setBackgroundImage(this.backgroundUrl);
        break;
      }
      default: {
        this.configurationService.setBackgroundImage('none');
        break;
      }
    }
  }

  restoreConfiguration(): void {
    this.configurationService.getLocalStorage();
    this.ngOnInit();
  }

  ngOnDestroy(): void {
      this.connectionService.disconnect();
      this.amountTouchPointsSubscription?.unsubscribe();
      this.configurationService.backupTimestamp$.unsubscribe();
      this.layersSubscription?.unsubscribe();
      this.stateSubscription?.unsubscribe();
  }
}
