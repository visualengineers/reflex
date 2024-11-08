import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TrackingService } from '../../shared/services/tracking.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { LogService } from '../log/log.service';
import { mergeMap, tap } from 'rxjs/operators';
import { CameraConfiguration, DepthCamera, DepthCameraState, TrackingConfigState } from '@reflex/shared-types';

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss']
})
export class TrackingComponent implements OnInit, OnDestroy {

  public cameras = new Array<DepthCamera>();
  public configurations = new Array<CameraConfiguration>();

  public selectedCameraIdx = -1;
  public selectedConfigurationIdx = -1;

  public statusText = '';
  public statusDetailsText = '';

  public canStart = false;
  public isActive = false;

  public autostart = false;

  public displayPointCloud = true;
  public displayDepthImage = true;

  private statusSubscription?: Subscription;
  private configSubscription?: Subscription;
  private selectedCamSubscription?: Subscription;
  private readonly selectedCamConfigSubscription?: Subscription;
  private readonly cameraSubscription?: Subscription;
  private autostartSubscription?: Subscription;

  public constructor(
    private readonly trackingService: TrackingService,
    private readonly settingsService: SettingsService,
    private readonly logService: LogService
  ) { }

  public ngOnInit(): void {
    this.trackingService.getCameras().subscribe({
      next: (result) => {
        this.cameras = result;
      },
      error: (error) => {
        this.logService.sendErrorLog(`${error}`);
        console.error(error);
      }
    });

    this.autostartSubscription = this.trackingService.queryAutostartEnabled().subscribe({
      next: (result) => {
        this.autostart = result === 'true';
      },
      error: (error) => {
        this.logService.sendErrorLog(`${error}`);
        console.error(error);
      }
    });

    this.statusSubscription = this.trackingService.getStatus()
      .subscribe({
        next: (result) => {
          this.updateStatusText(result);
          this.updateState();
        },
        error: (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      });

    this.selectedCamSubscription = this.trackingService.getSelectedCamera()
      .subscribe({
        next: (result) => {
          this.updateSelectedCamera(result);
        },
        error: (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      });

    this.settingsService.update();

    this.updateState();
  }

  public ngOnDestroy(): void {
    this.cameraSubscription?.unsubscribe();
    this.configSubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
    this.selectedCamSubscription?.unsubscribe();
    this.selectedCamConfigSubscription?.unsubscribe();
    this.autostartSubscription?.unsubscribe();
  }

  public updateConfigurations(): void {
    this.selectedConfigurationIdx = 0;
    this.updateState();

    if (this.selectedCameraIdx === undefined || this.selectedCameraIdx < 0) {
      this.configurations = [];

      return;
    }

    this.configSubscription?.unsubscribe();
    this.configSubscription = this.trackingService.getConfigurationsForCamera(this.selectedCameraIdx)
      .pipe(
        tap((result) => {
          this.configurations = result;
        }),
        mergeMap(() => this.trackingService.getSelectedCameraConfig())
      )
      .subscribe(
        (config) => {
          this.updateSelectedCameraConfig(config);
          this.settingsService.update();
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public updateState(): void {
    this.canStart = this.selectedCameraIdx !== undefined
      && this.selectedCameraIdx >= 0
      && this.selectedCameraIdx < this.cameras.length
      && this.selectedConfigurationIdx !== undefined
      && this.selectedConfigurationIdx >= 0
      && this.selectedConfigurationIdx < this.configurations.length;
  }

  public getConfigDescription(cfg: CameraConfiguration): string {
    let desc = `${cfg.width} x ${cfg.height} @ ${cfg.framerate}fps`;

    if (cfg.name.length > 0) {
      desc = `${cfg.name}: (${desc})`;
    }

    return desc;
  }

  public start(): void {
    this.trackingService.toggleCamera(this.selectedCameraIdx, this.selectedConfigurationIdx)
      .subscribe(
        (result) => {
          console.log('toggled camera', result);
          this.settingsService.update();
        },
        (error) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );
  }

  public saveAutoStart(): void {
    this.trackingService.setAutostartEnabled(this.autostart).subscribe(
      (result) => {
        this.autostart = result as boolean;
        this.settingsService.update();
      },
      (error) => {
        this.logService.sendErrorLog(`${error}`);
        console.error(error);
      }
    );
  }

  public onDepthImageFullScreenChanged(fullscreen: boolean): void {
    this.displayPointCloud = !fullscreen;
  }

  public onPointCloudFullScreenChanged(fullscreen: boolean): void {
    this.displayDepthImage = !fullscreen;
  }

  private updateSelectedCamera(selectedCam: DepthCamera): void {
    this.selectedCameraIdx = selectedCam === null ? -1 : this.cameras.map((cam) => cam.id).indexOf(selectedCam.id);

    this.updateConfigurations();
  }

  private updateSelectedCameraConfig(selectedCamConfig: CameraConfiguration): void {
    this.selectedConfigurationIdx = selectedCamConfig === null ? -1 : this.configurations.map((config) => this.getConfigDescription(config)).indexOf(this.getConfigDescription(selectedCamConfig));
    this.updateState();
  }

  private updateStatusText(status: TrackingConfigState): void {
    if (typeof status === 'undefined' || status === null) {
      this.statusText = 'Invalid Status !';
      this.isActive = false;

      return;
    }

    const cameraDesc = status.depthCameraStateName ?? 'no camera selected';
    const configDesc = status.isCameraSelected && status.selectedConfigurationName ? status.selectedConfigurationName : 'no config selected';

    this.statusText = `${cameraDesc}`;
    this.statusDetailsText = `${configDesc}`;

    this.isActive = status.depthCameraStateName === DepthCameraState[DepthCameraState.Streaming];

  }

}
