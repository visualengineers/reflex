import { HttpHeaders } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, from, fromEventPattern, Observable, using } from 'rxjs';
import { concatMap, filter, share, skipWhile } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';

export abstract class SignalRBaseService<T> {

  protected readonly connection: signalR.HubConnection;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  protected isConnected = new BehaviorSubject<boolean>(false);

  private readonly status$: Observable<T>;
  private readonly isStarted = new BehaviorSubject<boolean>(false);

  private readonly startAfterConnected$: Observable<void>;

  public constructor(private readonly url: string, method: string, protected readonly logService: LogService) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.url)
      .build();

    // update connection status the rxjs way
    from(this.connection.start()).subscribe(
      () => this.isConnected.next(true),
      (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }
    );

    this.status$ = fromEventPattern<T>(
      (handler) => this.connection.on(method, handler),
      (handler) => this.connection.off(method, handler)
    )
      .pipe(
        share(),
        filter((x) => x !== undefined)
      );

    // send 'startState' only after 'isConnected' emits true
    this.startAfterConnected$ = this.isConnected.pipe(
      skipWhile((value) => !value),
      concatMap(async () => this.connection.send('startState').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }))
    );
  }

  public getStatus(): Observable<T> {
    return using(
      () => {
        this.startAfterConnected$.subscribe(() => this.isStarted.next(true));

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return { unsubscribe: async () => this.connection.send('stopState').catch((error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }) };
      },
      () => this.status$
    );
  }
}
