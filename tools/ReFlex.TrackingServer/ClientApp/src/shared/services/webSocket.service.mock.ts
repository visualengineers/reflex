import { Observable, of, Subject } from 'rxjs';
import { WebSocketSubjectConfig } from 'rxjs/webSocket';
import { WebSocketService } from './webSocket.service';

export class WebSocketServiceMock implements Partial<WebSocketService> {
    private _requestSubject?: Subject<MessageEvent>;

    public get requestSubject(): Subject<MessageEvent> {
        if (this._requestSubject === undefined) {
            return this.initRequestStream();
        }
        return this._requestSubject;
    }

    public constructor(private _responseSubject: Subject<MessageEvent>, private _desiredType: string) {
        
    }

    public createSocket(cfg: WebSocketSubjectConfig<MessageEvent>): Subject<MessageEvent> {
        return this.initRequestStream();
    };

    public getResponseStream(): Observable<MessageEvent> {
        if (this._responseSubject === undefined) {
            return of();
            }
        return this._responseSubject;
    }

    private initRequestStream(): Subject<MessageEvent> {
        this._requestSubject = new Subject<MessageEvent>();
        
        this._requestSubject.subscribe((msg) => {
            if (this._desiredType === msg.type) {
                this._responseSubject.next(msg);
                
                // console.error(`### ${msg?.data} ###`);
            }            
        });

        return this._requestSubject;
    }
}