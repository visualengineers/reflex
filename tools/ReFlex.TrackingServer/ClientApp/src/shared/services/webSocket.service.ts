import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private _socket?: WebSocketSubject<MessageEvent>;

  public createSocket(cfg: WebSocketSubjectConfig<MessageEvent>): Subject<MessageEvent> {
    this._socket = webSocket(cfg);

    return this._socket;
  }

  public getResponseStream(): Observable<MessageEvent> {
    if (this._socket === undefined) {
      return of();
    }

    return this._socket.asObservable();
  }
}
