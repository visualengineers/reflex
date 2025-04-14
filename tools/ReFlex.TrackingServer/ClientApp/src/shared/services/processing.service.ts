import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { fromEventPattern, Observable, using } from 'rxjs';
import { SignalRBaseService } from './signalR.base.service';
import { LogService } from 'src/app/log/log.service';
import { Interaction, InteractionVelocity, InteractionFrame, InteractionHistory, JsonSimpleValue, RemoteProcessingServiceSettings } from '@reflex/shared-types';

@Injectable({
  providedIn: 'root'
})
export class ProcessingService extends SignalRBaseService<string> {

  private readonly processingRoute = 'api/Processing/';
  private readonly isLoopRunningRoute = `${this.processingRoute}IsLoopRunning/`;
  private readonly getIntervalRoute = `${this.processingRoute}GetInterval/`;
  private readonly getRemoteProcessorSettingsRoute = `${this.processingRoute}GetRemoteProcessorSettings/`;
  private readonly getObserverTypesRoute = `${this.processingRoute}GetObserverTypes/`;
  private readonly getSelectedObserverTypeRoute = `${this.processingRoute}GetObserverType/`;
  private readonly setIntervalRoute = `${this.processingRoute}SetUpdateInterval`;
  private readonly setRemoteProcessorSettingsRoute = `${this.processingRoute}SetRemoteProcessorSettings/`;
  private readonly setObserverTypeRoute = `${this.processingRoute}SelectObserverType`;
  private readonly toggleInteractionProcessingRoute = `${this.processingRoute}ToggleInteractionProcessing/`;

  // eslint-disable-next-line new-cap
  public constructor(private readonly http: HttpClient, @Inject('BASE_URL') private readonly baseUrl: string, logService: LogService) {
    super(`${baseUrl}prochub`, 'processingState', logService);
  }

  public getIsLoopRunning(): Observable<HttpResponse<JsonSimpleValue>> {
    return this.http.get<HttpResponse<JsonSimpleValue>>(this.baseUrl + this.isLoopRunningRoute);
  }

  public getInterval(): Observable<number> {
    return this.http.get<number>(this.baseUrl + this.getIntervalRoute);
  }

  public getRemoteProcessorSettings(): Observable<RemoteProcessingServiceSettings> {
    return this.http.get<RemoteProcessingServiceSettings>(this.baseUrl + this.getRemoteProcessorSettingsRoute);
  }

  public getObserverTypes(): Observable<Array<string>> {
    return this.http.get<Array<string>>(this.baseUrl + this.getObserverTypesRoute);
  }

  public getSelectedObserverType(): Observable<number> {
    return this.http.get<number>(this.baseUrl + this.getSelectedObserverTypeRoute);
  }

  public setInterval(interval: number): Observable<HttpResponse<JsonSimpleValue>> {
    const args: JsonSimpleValue = { name: 'UpdateInterval', value: interval };

    return this.http.post<JsonSimpleValue>(this.baseUrl + this.setIntervalRoute, args, { observe: 'response' });
  }

  public setRemoteProcessorSettings(settings: RemoteProcessingServiceSettings): Observable<HttpResponse<RemoteProcessingServiceSettings>> {

    return this.http.post<RemoteProcessingServiceSettings>(this.baseUrl + this.setRemoteProcessorSettingsRoute, settings, { observe: 'response' });
  }

  public setObserverType(observerType: string): Observable<HttpResponse<JsonSimpleValue>> {
    const args: JsonSimpleValue = { name: 'ObserverType', value: observerType };

    return this.http.post<JsonSimpleValue>(this.baseUrl + this.setObserverTypeRoute, args, { observe: 'response' });
  }

  public toggleProcessing(): Observable<HttpResponse<JsonSimpleValue>> {
    return this.http.put<JsonSimpleValue>(this.baseUrl + this.toggleInteractionProcessingRoute, { headers: this.headers }, { observe: 'response' });
  }

  public getInteractions(): Observable<Array<Interaction>> {
    const interactions$ = fromEventPattern<Array<Interaction>>(
      (handler) => this.connection.on('interactions', handler),
      (handler) => this.connection.off('interactions', handler)
    );

    return using(() => {
      this.connection.send('StartInteractions').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('StopInteractions').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => interactions$);

  }

  public getVelocities(): Observable<Array<InteractionVelocity>> {
    const velocities$ = fromEventPattern<Array<InteractionVelocity>>(
      (handler) => this.connection.on('velocities', handler),
      (handler) => this.connection.off('velocities', handler)
    );

    return using(() => {
      this.connection.send('StartVelocities').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('StopVelocities').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => velocities$);

  }

  public getFrames(): Observable<Array<InteractionFrame>> {
    const frames$ = fromEventPattern<Array<InteractionFrame>>(
      (handler) => this.connection.on('frames', handler),
      (handler) => this.connection.off('frames', handler)
    );

    return using(() => {
      this.connection.send('StartInteractionFrames').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('StopInteractionFrames').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => frames$);
  }

  public getHistory(): Observable<Array<InteractionHistory>> {
    const history$ = fromEventPattern<Array<InteractionHistory>>(
      (handler) => this.connection.on('history', handler),
      (handler) => this.connection.off('history', handler)
    );

    return using(() => {
      this.connection.send('StartInteractionHistory').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('StopInteractionHistory').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => history$);
  }
}
