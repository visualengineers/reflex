import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SignalRBaseService } from './signalR.base.service';
import { fromEventPattern, Observable, using } from 'rxjs';
import { concatMap, share, skipWhile } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { Configuration, DataFormats } from '@reflex/shared-types';

@Injectable({
  providedIn: 'root'
})
export class TuioService extends SignalRBaseService<string> {
  private readonly tuioRoute = 'api/Tuio/';

  private readonly getConfigurationRoute = `${this.tuioRoute}GetTuioConfiguration`;

  private readonly getIsBroadcastingRoute = `${this.tuioRoute}IsBroadcasting`;

  private readonly getTransportProtocolsRoute = `${this.tuioRoute}GetTransportProtocols`;
  private readonly getTuioVersionsRoute = `${this.tuioRoute}GetTuioProtocolVersions`;
  private readonly getTuioInterpretationsRoute = `${this.tuioRoute}GetTuioInterpretations`;

  private readonly setAddressRoute = `${this.tuioRoute}SetAddress`;
  private readonly setPortRoute = `${this.tuioRoute}SetPort`;

  private readonly selectTransportProtocolRoute = `${this.tuioRoute}SelectTransportProtocol`;
  private readonly selectTuioProtocolRoute = `${this.tuioRoute}SelectTuioProtocol`;
  private readonly selectTuioInterpretationRoute = `${this.tuioRoute}SelectTuioInterpretation`;

  private readonly toggleBroadcastRoute = `${this.tuioRoute}ToggleBroadcast`;

  private readonly saveTuioSettingsRoute = `${this.tuioRoute}Save`;

  private readonly packages$: Observable<DataFormats.TuioPackageDetails>;
  private readonly startPackagesAfterConnected$: Observable<void>;

  public constructor(
    private readonly http: HttpClient,
    logService: LogService,
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string
  ) {
    super(`${baseUrl}tuiohub`, 'tuioState', logService);

    this.packages$ = fromEventPattern<DataFormats.TuioPackageDetails>(
      (handler) => this.connection.on('currentPackage', handler),
      (handler) => this.connection.off('currentPackage', handler)
    )
      .pipe(
        share()
      );

    // send 'startState' only after 'isConnected' emits true
    this.startPackagesAfterConnected$ = this.isConnected.pipe(
      skipWhile((value) => !value),
      concatMap(async () => this.connection.send('startPackageDetails'))
    );
  }

  public getPackages(): Observable<DataFormats.TuioPackageDetails> {
    return using(
      () => {
        this.startPackagesAfterConnected$.subscribe(() => {}, (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return { unsubscribe: async () => this.connection.send('stopPackageDetails').catch((error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }) };
      },
      () => this.packages$
    );
  }

  public getIsBroadcasting(): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    return this.http.get<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.getIsBroadcastingRoute,
      { observe: 'response' }
    );
  }

  public getConfig(): Observable<Configuration.TuioConfiguration> {
    return this.http.get<Configuration.TuioConfiguration>(
      this.baseUrl + this.getConfigurationRoute,
      { headers: this.headers }
    );
  }

  public getTransportProtocols(): Observable<Array<string>> {
    return this.http.get<Array<string>>(
      this.baseUrl + this.getTransportProtocolsRoute,
      { headers: this.headers }
    );
  }

  public getTuioProtocolVersions(): Observable<Array<string>> {
    return this.http.get<Array<string>>(
      this.baseUrl + this.getTuioVersionsRoute,
      { headers: this.headers }
    );
  }

  public getTuioInterpretations(): Observable<Array<string>> {
    return this.http.get<Array<string>>(
      this.baseUrl + this.getTuioInterpretationsRoute,
      { headers: this.headers }
    );
  }

  public setAddress(
    address: string
  ): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    const args: DataFormats.JsonSimpleValue = { name: 'Address', value: address };

    return this.http.post<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.setAddressRoute,
      args,
      { observe: 'response' }
    );
  }

  public setPort(port: number): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    const args: DataFormats.JsonSimpleValue = { name: 'Port', value: port };

    return this.http.post<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.setPortRoute,
      args,
      { observe: 'response' }
    );
  }

  public setTransportProtocol(
    observerType: string
  ): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    const args: DataFormats.JsonSimpleValue = { name: 'TransportProtocol', value: observerType };

    return this.http.post<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.selectTransportProtocolRoute,
      args,
      { observe: 'response' }
    );
  }

  public setTuioProtocolVersion(
    observerType: string
  ): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    const args: DataFormats.JsonSimpleValue = { name: 'ProtocolVersion', value: observerType };

    return this.http.post<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.selectTuioProtocolRoute,
      args,
      { observe: 'response' }
    );
  }

  public setTuioInterpretation(
    observerType: string
  ): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    const args: DataFormats.JsonSimpleValue = { name: 'TuioInterpretation', value: observerType };

    return this.http.post<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.selectTuioInterpretationRoute,
      args,
      { observe: 'response' }
    );
  }

  public toggleBroadcasting(): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    return this.http.put<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.toggleBroadcastRoute,
      { headers: this.headers },
      { observe: 'response' }
    );
  }

  public saveSettings(): Observable<HttpResponse<DataFormats.JsonSimpleValue>> {
    return this.http.put<DataFormats.JsonSimpleValue>(
      this.baseUrl + this.saveTuioSettingsRoute,
      { headers: this.headers },
      { observe: 'response' }
    );
  }
}
