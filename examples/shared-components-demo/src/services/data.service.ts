import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable(
  {
    providedIn: 'root'
  }
)
export class DataService {

  public constructor(private httpClient: HttpClient) {

  }

  public loadAngularJson(): Observable<string> {
    return this.httpClient.request('GET', 'assets/angular_json.txt', { responseType: 'text' });
  }

  public loadPackageJson(): Observable<string> {
    return this.httpClient.request('GET', 'assets/package_json.txt', { responseType: 'text' });
  }

  public loadComponentImports(): Observable<string> {
    return this.httpClient.request('GET', 'assets/component_imports.txt', { responseType: 'text' });
  }

}
