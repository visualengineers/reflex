import {Injectable} from '@angular/core';
import {WebSocketSubject} from 'rxjs/webSocket';
import {interval, Observable, Subject, Subscription} from 'rxjs';
import {ConfigurationService} from './configuration.service';
import {TouchPoint} from '../model/TouchPoint';
import { delay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  private socket?: WebSocketSubject<Array<TouchPoint>>;
  private sendInterval$?: Observable<number>;
  private touchPoints: Array<TouchPoint> = new Array<TouchPoint>();

  private sendIntervalSubscription?: Subscription;
  private autoReconnectSubscription?: Subscription;

  public connectionSuccessful : Subject<boolean>;

  public doReconnect: boolean = true;

  constructor(private configurationService: ConfigurationService) {
    this.connectionSuccessful = new Subject();
  }

  init(): void {    
    this.autoReconnectSubscription = this.connectionState().pipe(
      tap(result => this.doReconnect = !result),
      // wait for 2 seconds to reconnect
      delay(2000),
      tap(() => {
        // if reconnect is still required - do reconnect
        if (this.doReconnect === true && (!this.socket || this.socket.closed)) {
          this.doReconnect = false;
          this.connect();
      }
    })).subscribe();
    
    this.reconnect();
  }

  destroy(): void {
    this.autoReconnectSubscription?.unsubscribe();
    this.disconnect(false);    
  }

  reconnect(): void {    
    this.disconnect(true);        
  }

  disconnect(triggerReconnect : boolean = true): void {
    
    this.socket?.complete();
    this.socket?.unsubscribe();    
    this.sendIntervalSubscription?.unsubscribe();    
    if (triggerReconnect)
      this.connectionSuccessful?.next(false);
  }

  sendMessage(touchPoints: TouchPoint[]): void {
    this.touchPoints = touchPoints;
  }

  public connectionState() : Observable<boolean> {
    return this.connectionSuccessful.asObservable();
  }

  private connect(): void { 
    if (!this.socket || this.socket.closed) {
      this.socket = new WebSocketSubject(this.configurationService.getServerConnection());
    }

    this.connectionSuccessful.next(true);

    this.socket.subscribe(
        result => {
          console.log("websocket says: " + result);
        },
        error => {
          this.disconnect();
          console.error(error);        
        },
        () => {
          this.disconnect();
          console.log("websocket subscription Completed");
        }
    );
    this.sendInterval$ = interval(this.configurationService.getSendInterval());
    this.sendIntervalSubscription = this.sendInterval$.subscribe(() => this.doSend(this.touchPoints));
  }

  private doSend(touchPoints: TouchPoint[]) {
    if (this.socket && !this.socket?.isStopped && !this.socket.closed && !this.socket.hasError)
      this.socket.next(touchPoints);
  }
}
