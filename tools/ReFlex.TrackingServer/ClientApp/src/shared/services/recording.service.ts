import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CameraConfiguration,
  RecordingStateUpdate,
  TrackingConfigState
} from '@reflex/shared-types';
import { Observable } from 'rxjs';
import { filter, share, take } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { SignalRBaseService } from './signalR.base.service';

@Injectable({
  providedIn: 'root'
})
export class RecordingService extends SignalRBaseService<TrackingConfigState> {
  private readonly http = inject(HttpClient);
  private readonly baseUrl: string;

  private readonly baseRoute = 'api/Tracking/';

  private readonly getRecordingsRoute = `${this.baseRoute}Recordings`;

  private readonly startRecordingRoute = `${this.baseRoute}StartRecording`;
  private readonly stopRecordingRoute = `${this.baseRoute}StopRecording`;
  private readonly getRecordingStateRoute = `${this.baseRoute}RecordingState`;
  private readonly getRecordingFrameCountRoute = `${this.baseRoute}RecordingFrameCount/`;

  private readonly clearRecordingsRoute = `${this.baseRoute}ClearRecordings`;
  private readonly deleteRecordingRoute = `${this.baseRoute}DeleteRecording`;

  private readonly recordingState$ = new Observable<RecordingStateUpdate>((subscriber) => {
    const handler = (status: RecordingStateUpdate): void => subscriber.next(status);
    this.connection.on('recordingState', handler);

    let started = false;
    const start = this.isConnected.pipe(filter(Boolean), take(1)).subscribe(() => {
      started = true;
      this.connection.send('StartRecordingState').catch((error) => {
        this.logService.sendErrorLog(`${error}`);
        subscriber.error(error);
      });
    });

    return (): void => {
      start.unsubscribe();
      this.connection.off('recordingState', handler);
      if (started) {
        this.connection.send('StopRecordingState').catch((error) => {
          this.logService.sendErrorLog(`${error}`);
        });
      }
    };
  }).pipe(share());


  public constructor() {
    const baseUrl = inject(BASE_URL);
    const logService = inject(LogService);

    super(`${baseUrl}trkhub`, 'trackingState', logService);

    this.baseUrl = baseUrl;
  }

  public getRecordings(): Observable<Array<CameraConfiguration>> {
    return this.http.get<Array<CameraConfiguration>>(
      this.baseUrl + this.getRecordingsRoute
    );
  }

  public startRecording(name: string, usePng = false): Observable<string> {
    return this.http.put(this.baseUrl + this.startRecordingRoute, JSON.stringify(name), {
      params: { usePng },
      headers: this.headers,
      responseType: 'text'
    });
  }

  public stopRecording(): Observable<CameraConfiguration> {
    return this.http.get<CameraConfiguration>(
      this.baseUrl + this.stopRecordingRoute
    );
  }

  public queryRecordingState(): Observable<string> {
    return this.http.get(this.baseUrl + this.getRecordingStateRoute, {
      responseType: 'text'
    });
  }

  public queryRecordingStateFrameCount(name: string): Observable<string> {
    return this.http.get(
      this.baseUrl + this.getRecordingFrameCountRoute + name,
      { responseType: 'text' }
    );
  }

  public clearRecordings(): Observable<string> {
    return this.http.get(this.baseUrl + this.clearRecordingsRoute, {
      responseType: 'text'
    });
  }

  public deleteRecording(name: string): Observable<string> {
    return this.http.put(
      this.baseUrl + this.deleteRecordingRoute,
      `"${name}"`,
      { headers: this.headers, responseType: 'text' }
    );
  }


  public getRecordingState(): Observable<RecordingStateUpdate> {
    return this.recordingState$;
  }
}
