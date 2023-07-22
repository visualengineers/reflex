import { Inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, from, fromEventPattern, Observable, using } from 'rxjs';
import { concatMap, filter, share, skipWhile } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { PerformanceData } from '../../../../../../packages/reflex-shared-types/src/data-formats/performance-data';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  protected isConnected = new BehaviorSubject<boolean>(false);

  private readonly connection: signalR.HubConnection;
  private readonly startAfterConnected$: Observable<void>;

  private readonly performanceData$: Observable<PerformanceData>;
  private readonly isStarted = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line new-cap
  public constructor(@Inject('BASE_URL') private readonly baseUrl: string, private readonly logService: LogService) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}perfhub`)
      .build();

    // update connection status the rxjs way
    from(this.connection.start()).subscribe(
      () => this.isConnected.next(true),
      (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }
    );


    this.performanceData$ = fromEventPattern<PerformanceData>(
      (handler) => this.connection.on('performanceData', handler),
      (handler) => this.connection.off('performanceData', handler)
    ).pipe(
      share(),
      filter((x) => x !== undefined)
    );


    // send 'startState' only after 'isConnected' emits true
    this.startAfterConnected$ = this.isConnected.pipe(
      skipWhile((value) => !value),
      concatMap(async () => this.connection.send('startCollectingData').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }))
    );
  }

  /**
     * @return an Observable of Arrays of Point3 from the currently configured camera
     */
  public getData(): Observable<PerformanceData> {


    return using(() => {
      this.startAfterConnected$.subscribe(() => this.isStarted.next(true));

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('stopCollectingData').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => this.performanceData$);

  }
}
