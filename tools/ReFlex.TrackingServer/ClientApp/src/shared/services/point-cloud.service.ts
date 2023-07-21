import { Inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, from, fromEventPattern, Observable, using } from 'rxjs';
import { concatMap, filter, share, skipWhile } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { Point3 } from 'src/shared/tracking/point3';

@Injectable({
  providedIn: 'root'
})
export class PointCloudService {
  private readonly connection: signalR.HubConnection;

  private readonly isConnected = new BehaviorSubject<boolean>(false);
  private readonly isStarted = new BehaviorSubject<boolean>(false);

  private readonly startAfterConnected$: Observable<void>;
  private readonly points$: Observable<Array<Point3>>;

  // eslint-disable-next-line new-cap
  public constructor(@Inject('BASE_URL') private readonly baseUrl: string, private readonly logService: LogService) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}pointcloudhub`)
      .build();

    // update connection status the rxjs way
    from(this.connection.start()).subscribe(
      () => this.isConnected.next(true),
      (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }
    );

    this.points$ = fromEventPattern<Array<Point3>>(
      (handler) => this.connection.on('pointCloud', handler),
      (handler) => this.connection.off('pointCloud', handler)
    )
      .pipe(
        share(),
        filter((x) => x !== undefined)
      );

    // send 'startState' only after 'isConnected' emits true
    this.startAfterConnected$ = this.isConnected.pipe(
      skipWhile((value) => !value),
      concatMap(async () => this.connection.send('startPointCloud').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }))
    );
  }

  /**
   * @return an Observable of Arrays of Point3 from the currently configured camera
   */
  public getPointCloud(): Observable<Array<Point3>> {
    return using(() => {
      this.startAfterConnected$.subscribe(() => this.isStarted.next(true));

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('stopPointCloud').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => this.points$);

  }
}
