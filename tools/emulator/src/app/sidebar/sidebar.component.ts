import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Camera, ConfigurationService, CircleSize, Layers, ViewOption, ViewPort } from '../service/configuration.service';
import { ConnectionService} from '../service/connection.service';
import { BackgroundSource } from '../model/BackgroundSource.model';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.sass'],
    imports: [
      CommonModule,
      FormsModule
    ]
})
export class SidebarComponent implements OnInit, OnDestroy {

  public isCollapsed = false;
  public showTracking = true;
  public showProjection = false;
  public backupTimestamp: Date | null = new Date();
  public backgroundType = 0; // 0: none | 1: from 'assets/img' | 2: url
  public amountProjectionLayers: number = 0;
  public amountTouchPoints: number = 0;
  public backgroundImage: string = '';
  public backgroundSources: BackgroundSource[] = [];
  public backgroundUrl: string = '';
  public camera?: Camera;
  public cameraOptions?: Camera[];
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
    private renderer : Renderer2
  ) { }

  ngOnInit(): void {
    this.connectionService.init();

    this.amountProjectionLayers = this.configurationService.getAmountProjectionLayers();
    this.backgroundSources = this.configurationService.getBackgroundSources();
    this.cameraOptions = this.configurationService.getCameraOptions();
    this.camera = this.configurationService.getCamera();
    this.circleSize = this.configurationService.getCircleSize();
    this.sendInterval = this.configurationService.getSendInterval();
    this.serverConnection = this.configurationService.getServerConnection();
    this.viewOptions = this.configurationService.getViewOptions();
    this.viewPort = this.configurationService.getViewPort();

    this.configurationService.backupTimestamp$
      .subscribe(x => this.backupTimestamp = x);

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

  saveConfiguration(): void {

    this.configurationService.setAmountProjectionLayers(this.amountProjectionLayers);
    this.configurationService.setAmountTouchPoints(this.amountTouchPoints);
    if (this.camera !== undefined) {
      this.configurationService.setCamera(this.camera);
    }
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

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSidebarContent(): void {
    this.showProjection = !this.showProjection;
    this.showTracking = !this.showTracking;
  }

  ngOnDestroy() {
    this.connectionService.destroy();
    this.amountTouchPointsSubscription?.unsubscribe();
    this.configurationService.backupTimestamp$.unsubscribe();
    this.layersSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

}
