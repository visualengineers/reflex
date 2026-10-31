import { BASE_URL } from 'src/shared/tokens/base-url.token';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppVersionInfo } from '@reflex/shared-types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VersionInfoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL);

  private readonly packageFile = 'assets/data/package.json';
  private readonly versionAddress = `${this.baseUrl}api/versionInfo`;

  public getServerVersionInfo(): Observable<Array<AppVersionInfo>> {
    return this.http.get<Array<AppVersionInfo>>(this.versionAddress);
  }

  public getClientVersionInfo(): Observable<Array<AppVersionInfo>> {
    return this.http
      .get(this.packageFile)
      .pipe(
        map((result: any) =>
          Object.keys(result['dependencies']).map((value) => ({
            name: value,
            version: result['dependencies'][value]
          })))
      );
  }

  public getAppVersionInfo(): Observable<AppVersionInfo> {
    return this.http
      .get(this.packageFile)
      .pipe(
        map((result: any) => ({
          name: result['name'],
          version: result['version']
        }))
      );
  }
}
