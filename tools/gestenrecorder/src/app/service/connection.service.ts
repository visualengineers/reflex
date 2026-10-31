import { inject, Injectable } from '@angular/core';
import { Interaction } from '@reflex/shared-types';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';
import { ConfigurationService } from './configuration.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  public connectionSuccessful: Subject<boolean>;

  public doReconnect = true;
  private readonly configurationService = inject(ConfigurationService);

  private socket?: WebSocketSubject<Array<Interaction>>;
  private sendInterval$?: Observable<number>;
  private touchPoints: Array<Interaction> = [];

  private sendIntervalSubscription?: Subscription;
  private autoReconnectSubscription?: Subscription;

  public constructor() {
    this.connectionSuccessful = new Subject();
  }

  public init(): void {
    this.autoReconnectSubscription = this.connectionState()
      .pipe(
        tap((result) => (this.doReconnect = !result)),
        // wait for 2 seconds to reconnect
        delay(2000),
        tap(() => {
          // if reconnect is still required - do reconnect
          if (
            this.doReconnect
            && (!this.socket || this.socket.closed)
          ) {
            this.doReconnect = false;
            this.connect();
          }
        })
      )
      .subscribe();

    this.reconnect();
  }

  public destroy(): void {
    this.autoReconnectSubscription?.unsubscribe();
    this.disconnect(false);
  }

  public reconnect(): void {
    this.disconnect(true);
  }

  public disconnect(triggerReconnect = true): void {
    this.socket?.complete();
    this.socket?.unsubscribe();
    this.sendIntervalSubscription?.unsubscribe();
    if (triggerReconnect) {
      this.connectionSuccessful?.next(false);
    }
  }

  public sendMessage(touchPoints: Array<Interaction>): void {
    this.touchPoints = touchPoints;
  }

  public connectionState(): Observable<boolean> {
    return this.connectionSuccessful.asObservable();
  }

  private connect(): void {
    if (!this.socket || this.socket.closed) {
      this.socket = new WebSocketSubject(
        this.configurationService.getServerConnection()
      );
    }

    this.connectionSuccessful.next(true);

    this.socket.subscribe(
      (result) => {
        console.log('websocket says:', result);
      },
      (error) => {
        this.disconnect();
        console.error(error);
      },
      () => {
        this.disconnect();
        console.log('websocket subscription Completed');
      }
    );
    this.sendInterval$ = interval(this.configurationService.getSendInterval());
    this.sendIntervalSubscription = this.sendInterval$.subscribe(() =>
      this.doSend(this.touchPoints));
  }

  private doSend(touchPoints: Array<Interaction>): void {
    if (
      this.socket
      && !this.socket?.isStopped
      && !this.socket.closed
      && !this.socket.hasError
    ) {
      this.socket.next(touchPoints);
    }
  }
}
