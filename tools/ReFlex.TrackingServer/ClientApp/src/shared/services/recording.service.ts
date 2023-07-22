import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEventPattern, Observable, using } from 'rxjs';
import { SignalRBaseService } from './signalR.base.service';
import { LogService } from 'src/app/log/log.service';
import { CameraConfiguration, RecordingStateUpdate, TrackingConfigState } from '@reflex/shared-types';

@Injectable({
  providedIn: 'root'
})
export class RecordingService extends SignalRBaseService<TrackingConfigState> {
  private readonly baseRoute = 'api/Tracking/';

  private readonly getRecordingsRoute = `${this.baseRoute}Recordings`;

  private readonly startRecordingRoute = `${this.baseRoute}StartRecording`;
  private readonly stopRecordingRoute = `${this.baseRoute}StopRecording`;
  private readonly getRecordingStateRoute = `${this.baseRoute}RecordingState`;
  private readonly getRecordingFrameCountRoute = `${this.baseRoute}RecordingFrameCount/`;

  private readonly clearRecordingsRoute = `${this.baseRoute}ClearRecordings`;
  private readonly deleteRecordingRoute = `${this.baseRoute}DeleteRecording`;

  public constructor(
    private readonly http: HttpClient,
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string,
    logService: LogService
  ) {
    super(`${baseUrl}trkhub`, 'trackingState', logService);
  }

  public getRecordings(): Observable<Array<CameraConfiguration>> {
    return this.http.get<Array<CameraConfiguration>>(
      this.baseUrl + this.getRecordingsRoute
    );
  }

  public startRecording(name: string): Observable<string> {
    return this.http.put(
      this.baseUrl + this.startRecordingRoute,
      `"${name}"`,
      { headers: this.headers, responseType: 'text' }
    );
  }

  public stopRecording(): Observable<CameraConfiguration> {
    return this.http.get<CameraConfiguration>(
      this.baseUrl + this.stopRecordingRoute
    );
  }

  public queryRecordingState(): Observable<string> {
    return this.http.get(this.baseUrl + this.getRecordingStateRoute, { responseType: 'text' });
  }

  public queryRecordingStateFrameCount(name: string): Observable<string> {
    return this.http.get(
      this.baseUrl + this.getRecordingFrameCountRoute + name,
      { responseType: 'text' }
    );
  }

  public clearRecordings(): Observable<string> {
    return this.http.get(this.baseUrl + this.clearRecordingsRoute, { responseType: 'text' });
  }

  public deleteRecording(name: string): Observable<string> {
    return this.http.put(
      this.baseUrl + this.deleteRecordingRoute,
      `"${name}"`,
      { headers: this.headers, responseType: 'text' }
    );
  }

  public getRecordingState(): Observable<RecordingStateUpdate> {
    const recordingState$ = fromEventPattern<RecordingStateUpdate>(
      (handler) => this.connection.on('recordingState', handler),
      (handler) => this.connection.off('recordingState', handler)
    );

    return using(() => {
      this.connection.send('StartRecordingState').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('StopRecordingState').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => recordingState$);
  }
}
