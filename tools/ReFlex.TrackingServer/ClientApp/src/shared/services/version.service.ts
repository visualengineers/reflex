import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppVersionInfo } from '@reflex/shared-types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BASE_URL } from 'src/shared/tokens/base-url.token';

interface ClientPackageInfo {
  name: string;
  version: string;
  dependencies: Record<string, string>;
}

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
    return this.http.get<ClientPackageInfo>(this.packageFile).pipe(
      map((result) => Object.entries(result.dependencies).map(([name, version]) => ({ name, version })))
    );
  }

  public getAppVersionInfo(): Observable<AppVersionInfo> {
    return this.http.get<ClientPackageInfo>(this.packageFile).pipe(
      map(({ name, version }) => ({ name, version }))
    );
  }
}
