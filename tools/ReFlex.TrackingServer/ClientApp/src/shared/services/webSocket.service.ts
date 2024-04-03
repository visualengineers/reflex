import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket?: WebSocketSubject<MessageEvent>;

  public createSocket(cfg: WebSocketSubjectConfig<MessageEvent>): Subject<MessageEvent> {
    this.socket = webSocket(cfg);

    return this.socket;
  }

  public getResponseStream(): Observable<MessageEvent> {
    if (this.socket === undefined) {
      return of();
    }

    return this.socket.asObservable();
  }
}
