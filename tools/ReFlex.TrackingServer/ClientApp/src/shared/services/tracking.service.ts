import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CameraConfiguration,
  DepthCamera,
  TrackingConfigState
} from '@reflex/shared-types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { SignalRBaseService } from './signalR.base.service';

@Injectable({
  providedIn: 'root'
})
export class TrackingService extends SignalRBaseService<TrackingConfigState> {
  private readonly http = inject(HttpClient);
  private readonly baseUrl: string;

  private readonly cameraRoute = 'api/Tracking/';
  private readonly selectedCameraRoute = `${this.cameraRoute}SelectedCamera/`;
  private readonly selectedCameraConfigRoute = `${this.cameraRoute}SelectedCameraConfig/`;
  private readonly configRoute = `${this.cameraRoute}Configurations/`;
  private readonly toggleTrackingRoute = `${this.cameraRoute}ToggleTracking/`;
  private readonly setDepthImagePreviewStateRoute = `${this.cameraRoute}SetDepthImagePreview/`;
  private readonly getAutostartEnabledRoute = `${this.cameraRoute}GetAutoStartEnabled`;
  private readonly setAutostartRoute = `${this.cameraRoute}SetAutoStart`;

  public constructor() {
    const baseUrl = inject(BASE_URL);
    const logService = inject(LogService);

    super(`${baseUrl}trkhub`, 'trackingState', logService);

    this.baseUrl = baseUrl;
  }

  public getCameras(): Observable<Array<DepthCamera>> {
    return this.http.get<Array<DepthCamera>>(this.baseUrl + this.cameraRoute);
  }

  public getSelectedCamera(): Observable<DepthCamera> {
    return this.http.get<DepthCamera>(this.baseUrl + this.selectedCameraRoute);
  }

  public getSelectedCameraConfig(): Observable<CameraConfiguration> {
    return this.http.get<CameraConfiguration>(
      this.baseUrl + this.selectedCameraConfigRoute
    );
  }

  public getConfigurationsForCamera(
    cameraIdx: number
  ): Observable<Array<CameraConfiguration>> {
    return this.http.get<Array<CameraConfiguration>>(
      `${this.baseUrl}${this.configRoute}${cameraIdx}`
    );
  }

  public queryAutostartEnabled(): Observable<string> {
    return this.http.get(this.baseUrl + this.getAutostartEnabledRoute, {
      responseType: 'text'
    });
  }

  public setAutostartEnabled(enabled: boolean): Observable<boolean> {
    return this.http.put<boolean>(
      this.baseUrl + this.setAutostartRoute,
      enabled,
      { headers: this.headers }
    );
  }

  public toggleCamera(
    cameraIdx: number,
    configIdx: number
  ): Observable<number> {
    return this.http.put<number>(
      `${this.baseUrl}${this.toggleTrackingRoute}${cameraIdx}`,
      configIdx,
      { headers: this.headers }
    );
  }

  public setDepthImagePreviewState(newState: boolean): Observable<boolean> {
    const result = this.http.put<number>(
      `${this.baseUrl}${this.setDepthImagePreviewStateRoute}`,
      newState,
      { headers: this.headers }
    );

    return result.pipe(map((response: number) => response === 202));
  }
}
