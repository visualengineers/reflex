import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { concatMap, tap, catchError } from 'rxjs/operators';
import { JsonSimpleValue, LogMessageDetail } from '@reflex/shared-types';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject<string>('BASE_URL' as unknown);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  private readonly baseRoute = 'api/Log';
  private readonly route = `${this.baseUrl}${this.baseRoute}/Messages/`;
  private readonly routeAdd = `${this.baseUrl}${this.baseRoute}/Add/`;
  private index = 0;

  public getLogs(): Observable<LogMessageDetail> {
    const list = this.http
      .get<Array<LogMessageDetail>>(`${this.route}${this.index}`)
      .pipe(
        tap((completeMessages) => {
          this.index = Math.max(...completeMessages.map((elem) => elem.id));
        }),
        concatMap((result) => [...result]),
        catchError((error) => {
          console.error(error);
          throw error;
        })
      );

    return list;
  }

  public sendErrorLog(msg: string): void {
    const value: JsonSimpleValue = {
      name: 'message',
      value: msg
    };
    this.http
      .post<JsonSimpleValue>(this.routeAdd, value, { headers: this.headers })
      .subscribe(console.log, console.error);
  }

  public reset(): void {
    this.index = 0;
  }
}
