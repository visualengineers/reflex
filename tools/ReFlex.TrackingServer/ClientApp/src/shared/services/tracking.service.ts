import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SignalRBaseService } from './signalR.base.service';
import { LogService } from 'src/app/log/log.service';
import { CameraConfiguration, DepthCamera, TrackingConfigState } from '@reflex/shared-types';

@Injectable({
  providedIn: 'root'
})
export class TrackingService extends SignalRBaseService<TrackingConfigState> {

  private readonly cameraRoute = 'api/Tracking/';
  private readonly selectedCameraRoute = `${this.cameraRoute}SelectedCamera/`;
  private readonly selectedCameraConfigRoute = `${this.cameraRoute}SelectedCameraConfig/`;
  private readonly configRoute = `${this.cameraRoute}Configurations/`;
  private readonly toggleTrackingRoute = `${this.cameraRoute}ToggleTracking/`;
  private readonly setDepthImagePreviewStateRoute = `${this.cameraRoute}SetDepthImagePreview/`;
  private readonly getAutostartEnabledRoute = `${this.cameraRoute}GetAutoStartEnabled`;
  private readonly setAutostartRoute = `${this.cameraRoute}SetAutoStart`;

  public constructor(
    private readonly http: HttpClient,
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string,
    logService: LogService
  ) {
    super(`${baseUrl}trkhub`, 'trackingState', logService);
  }

  public getCameras(): Observable<Array<DepthCamera>> {
    return this.http.get<Array<DepthCamera>>(this.baseUrl + this.cameraRoute);
  }

  public getSelectedCamera(): Observable<DepthCamera> {
    return this.http.get<DepthCamera>(this.baseUrl + this.selectedCameraRoute);
  }

  public getSelectedCameraConfig(): Observable<CameraConfiguration> {
    return this.http.get<CameraConfiguration>(this.baseUrl + this.selectedCameraConfigRoute);
  }

  public getConfigurationsForCamera(cameraIdx: number): Observable<Array<CameraConfiguration>> {
    return this.http.get<Array<CameraConfiguration>>(`${this.baseUrl}${this.configRoute}${cameraIdx}`);
  }

  public queryAutostartEnabled(): Observable<string> {
    return this.http.get(this.baseUrl + this.getAutostartEnabledRoute, { responseType: 'text' });
  }

  public setAutostartEnabled(enabled: boolean): Observable<Object> {
    return this.http.put<boolean>(this.baseUrl + this.setAutostartRoute, enabled, { headers: this.headers });
  }

  public toggleCamera(cameraIdx: number, configIdx: number): Observable<Object> {
    return this.http.put<number>(`${this.baseUrl}${this.toggleTrackingRoute}${cameraIdx}`, configIdx, { headers: this.headers });
  }

  public async setDepthImagePreviewState(newState: boolean): Promise<Object> {
    return this.http.put<number>(`${this.baseUrl}${this.setDepthImagePreviewStateRoute}`, newState, { headers: this.headers });
  }
}
