import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BackgroundSource } from '../model/BackgroundSource.model';
import {
  Camera,
  CircleSize,
  ConfigurationService,
  Layers,
  ViewOption,
  ViewPort
} from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule]
})
export class SidebarComponent implements OnInit, OnDestroy {

  @ViewChild('indicator')
  private readonly indicator?: ElementRef;

  public isCollapsed = false;
  public showTracking = true;
  public showProjection = false;
  public backupTimestamp: Date | null = new Date();
  public backgroundType = 0; // 0: none | 1: from 'assets/img' | 2: url
  public amountProjectionLayers = 0;
  public amountTouchPoints = 0;
  public backgroundImage = '';
  public backgroundSources: Array<BackgroundSource> = [];
  public backgroundUrl = '';
  public camera?: Camera;
  public cameraOptions?: Array<Camera>;
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

  public sendInterval = 100;
  public serverConnection?: string;
  public viewOptions: Array<ViewOption> = [];
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly configurationService = inject(ConfigurationService);
  private readonly connectionService = inject(ConnectionService);
  private readonly renderer = inject(Renderer2);

  private amountTouchPointsSubscription?: Subscription;
  private layersSubscription?: Subscription;
  private stateSubscription?: Subscription;
  private backupSubscription?: Subscription;

  public ngOnInit(): void {
    this.connectionService.init();

    this.amountProjectionLayers
      = this.configurationService.getAmountProjectionLayers();
    this.backgroundSources = this.configurationService.getBackgroundSources();
    this.cameraOptions = this.configurationService.getCameraOptions();
    this.camera = this.configurationService.getCamera();
    this.circleSize = this.configurationService.getCircleSize();
    this.sendInterval = this.configurationService.getSendInterval();
    this.serverConnection = this.configurationService.getServerConnection();
    this.viewOptions = this.configurationService.getViewOptions();
    this.viewPort = this.configurationService.getViewPort();

    this.backupSubscription?.unsubscribe();
    this.backupSubscription
      = this.configurationService.backupTimestamp$.subscribe((x) => {
        this.backupTimestamp = x;
        this.changeDetector.markForCheck();
      });

    this.amountTouchPointsSubscription = this.configurationService
      .getAmountTouchPoints()
      .subscribe((amount) => {
        this.amountTouchPoints = amount;
        this.changeDetector.markForCheck();
      });

    this.layersSubscription = this.configurationService
      .getLayers()
      .subscribe((layers) => {
        this.layers = layers;
        this.changeDetector.markForCheck();
      });

    this.stateSubscription
      = this.connectionService.connectionSuccessful.subscribe((result) =>
        this.onWebSocketConnectionStateChanged(result));
  }

  public onWebSocketConnectionStateChanged(state: boolean): void {
    if (state) {
      this.renderer.addClass(this.indicator?.nativeElement, 'success');
      this.renderer.removeClass(this.indicator?.nativeElement, 'error');
    } else {
      this.renderer.addClass(this.indicator?.nativeElement, 'error');
      this.renderer.removeClass(this.indicator?.nativeElement, 'success');
    }
  }

  public onBackgroundSelected(): void {
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

  public restoreConfiguration(): void {
    this.configurationService.getLocalStorage();
    this.ngOnInit();
  }

  public saveConfiguration(): void {
    this.configurationService.setAmountProjectionLayers(
      this.amountProjectionLayers
    );
    this.configurationService.setAmountTouchPoints(this.amountTouchPoints);
    if (this.camera !== undefined) {
      this.configurationService.setCamera(this.camera);
    }
    this.configurationService.setCircleSize(this.circleSize);

    if (this.layers !== undefined) {
      this.configurationService.setLayers(this.layers);
    }
    this.configurationService.setSendInterval(this.sendInterval);

    if (this.serverConnection !== undefined) {
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

  public toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  public toggleSidebarContent(): void {
    this.showProjection = !this.showProjection;
    this.showTracking = !this.showTracking;
  }

  public ngOnDestroy(): void {
    this.connectionService.destroy();
    this.amountTouchPointsSubscription?.unsubscribe();
    this.backupSubscription?.unsubscribe();
    this.layersSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }
}
