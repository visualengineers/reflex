import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SignalRBaseService } from './signalR.base.service';
import { Observable } from 'rxjs';
import { JsonSimpleValue } from '../data-formats/json-simple-value';
import { NetworkAttributes } from '../data-formats/network-attributes';
import { LogService } from 'src/app/log/log.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkingService extends SignalRBaseService<string> {

  private readonly networkingRoute = 'api/Network/';

  private readonly getStatusRoute = `${this.networkingRoute}Status`;

  private readonly getAddressRoute = `${this.networkingRoute}GetAddress`;
  private readonly getPortRoute = `${this.networkingRoute}GetPort`;
  private readonly getEndpointRoute = `${this.networkingRoute}GetEndpoint`;

  private readonly setAddressRoute = `${this.networkingRoute}SetAddress`;
  private readonly setPortRoute = `${this.networkingRoute}SetPort`;
  private readonly setEndpointRoute = `${this.networkingRoute}SetEndpoint`;

  private readonly getSelectedNetworkTypeRoute = `${this.networkingRoute}GetNetworkType`;

  private readonly selectNetworkTypeRoute = `${this.networkingRoute}SelectNetworkType`;

  private readonly getNetworkTypesRoute = `${this.networkingRoute}GetNetworkTypes`;

  private readonly toggleNetworkingRoute = `${this.networkingRoute}ToggleNetworking`;

  private readonly saveNetworkingSettingsRoute = `${this.networkingRoute}Save`;

  public constructor(
    private readonly http: HttpClient,
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string,
    logService: LogService
  ) {
    super(`${baseUrl}nethub`, 'networkingState', logService);
  }

  public getStatusValues(): Observable<NetworkAttributes> {
    return this.http.get<NetworkAttributes>(this.baseUrl + this.getStatusRoute, { headers: this.headers });
  }

  public getAddress(): Observable<string> {
    return this.http.get(this.baseUrl + this.getAddressRoute, { responseType: 'text' });
  }

  public getPort(): Observable<number> {
    return this.http.get<number>(this.baseUrl + this.getPortRoute, { headers: this.headers });
  }

  public getEndpoint(): Observable<string> {
    return this.http.get(this.baseUrl + this.getEndpointRoute, { responseType: 'text' });
  }


  public getNetworkInterfaces(): Observable<Array<string>> {
    return this.http.get<Array<string>>(this.baseUrl + this.getNetworkTypesRoute, { headers: this.headers });
  }

  public getSelectedNetworkInterface(): Observable<number> {
    return this.http.get<number>(this.baseUrl + this.getSelectedNetworkTypeRoute, { headers: this.headers });
  }

  public setAddress(address: string): Observable<HttpResponse<JsonSimpleValue>> {
    const args: JsonSimpleValue = { name: 'Address', value: address };

    return this.http.post<JsonSimpleValue>(this.baseUrl + this.setAddressRoute, args, { observe: 'response' });
  }

  public setPort(port: number): Observable<HttpResponse<JsonSimpleValue>> {
    const args: JsonSimpleValue = { name: 'Port', value: port };

    return this.http.post<JsonSimpleValue>(this.baseUrl + this.setPortRoute, args, { observe: 'response' });
  }

  public setEndpoint(endpoint: string): Observable<HttpResponse<JsonSimpleValue>> {
    const args: JsonSimpleValue = { name: 'Endpoint', value: endpoint };

    return this.http.post<JsonSimpleValue>(this.baseUrl + this.setEndpointRoute, args, { observe: 'response' });
  }

  public setNetworkInterface(observerType: string): Observable<HttpResponse<JsonSimpleValue>> {
    const args: JsonSimpleValue = { name: 'NetworkType', value: observerType };

    return this.http.post<JsonSimpleValue>(this.baseUrl + this.selectNetworkTypeRoute, args, { observe: 'response' });
  }

  public toggleBroadcasting(): Observable<HttpResponse<JsonSimpleValue>> {
    return this.http.put<JsonSimpleValue>(this.baseUrl + this.toggleNetworkingRoute, { headers: this.headers }, { observe: 'response' });
  }

  public saveSettings(): Observable<HttpResponse<JsonSimpleValue>> {
    return this.http.put<JsonSimpleValue>(this.baseUrl + this.saveNetworkingSettingsRoute, { headers: this.headers }, { observe: 'response' });
  }


}
