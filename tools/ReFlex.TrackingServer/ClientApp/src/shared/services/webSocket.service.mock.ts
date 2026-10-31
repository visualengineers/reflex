import { Observable, of, Subject } from 'rxjs';
import { WebSocketService } from './webSocket.service';

export class WebSocketServiceMock implements Partial<WebSocketService> {
  private requestStream?: Subject<MessageEvent>;

  public constructor(private readonly responseSubject: Subject<MessageEvent>, private readonly desiredType: string) {

  }

  public get requestSubject(): Subject<MessageEvent> {
    if (this.requestStream === undefined) {
      return this.initRequestStream();
    }

    return this.requestStream;
  }

  public createSocket(): Subject<MessageEvent> {
    return this.initRequestStream();
  }

  public getResponseStream(): Observable<MessageEvent> {
    if (this.responseSubject === undefined) {
      return of();
    }

    return this.responseSubject;
  }

  private initRequestStream(): Subject<MessageEvent> {
    this.requestStream = new Subject<MessageEvent>();

    this.requestStream.subscribe((msg) => {
      if (this.desiredType === msg.type) {
        this.responseSubject.next(msg);

        // console.error(`### ${msg?.data} ###`);
      }
    });

    return this.requestStream;
  }
}
