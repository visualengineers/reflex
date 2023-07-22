/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppVersionInfo } from '../../../../../../packages/reflex-shared-types/src/data-formats/app-version-info';

@Injectable({
  providedIn: 'root'
})

export class VersionInfoService {

  private readonly packageFile = 'assets/data/package.json';
  private readonly versionAddress = `${this.baseUrl}api/versionInfo`;

  // eslint-disable-next-line new-cap
  public constructor(private readonly http: HttpClient, @Inject('BASE_URL') private readonly baseUrl: string) {

  }

  public getServerVersionInfo(): Observable<Array<AppVersionInfo>> {
    return this.http.get<Array<AppVersionInfo>>(this.versionAddress);
  }

  public getClientVersionInfo(): Observable<Array<AppVersionInfo>> {
    return this.http.get(this.packageFile).pipe(
      map((result: any) => Object.keys(result['dependencies']).map((value) => ({ name: value, version: result['dependencies'][value] })))
    );
  }

  public getAppVersionInfo(): Observable<AppVersionInfo> {
    return this.http.get(this.packageFile).pipe(
      map((result: any) => ({ name: result['name'], version: result['version'] }))
    );
  }
}
