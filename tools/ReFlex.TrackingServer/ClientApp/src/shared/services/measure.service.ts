import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeasureService {
  private readonly baseRoute = 'api/RecordRawDepth/';

  private readonly getIsCapturingRoute = `${this.baseRoute}IsCapturing`;

  private readonly getCurrentRecordIdRoute = `${this.baseRoute}CurrentRecordId`;
  private readonly getCurrentSampleIdxRoute = `${this.baseRoute}CurrentSampleIdx`;
  private readonly recordSamplesRoute = `${this.baseRoute}RecordSamples`;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  public constructor(
    private readonly http: HttpClient,
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string
  ) {
  }

  public isCapturing(): Observable<boolean> {
    return this.http.get<boolean>(this.baseUrl + this.getIsCapturingRoute);
  }

  public getCurrentRecordId(): Observable<number> {
    return this.http.get<number>(this.baseUrl + this.getCurrentRecordIdRoute);
  }

  public getCurrentSampleIdx(): Observable<number> {
    return this.http.get<number>(this.baseUrl + this.getCurrentSampleIdxRoute);
  }

  public startCapture(captureId: number): Observable<string> {
    return this.http.put(this.baseUrl + this.recordSamplesRoute, `{ "name" : "captureId", "value": ${captureId}}`, { headers: this.headers, responseType: 'text' });
  }
}
