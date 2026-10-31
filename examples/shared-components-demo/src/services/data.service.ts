import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly httpClient = inject(HttpClient);

  public loadAngularJson(): Observable<string> {
    return this.httpClient.request('GET', 'assets/angular_json.txt', {
      responseType: 'text'
    });
  }

  public loadPackageJson(): Observable<string> {
    return this.httpClient.request('GET', 'assets/package_json.txt', {
      responseType: 'text'
    });
  }

  public loadComponentImports(): Observable<string> {
    return this.httpClient.request('GET', 'assets/component_imports.txt', {
      responseType: 'text'
    });
  }
}
