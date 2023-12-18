import { Inject, Injectable } from '@angular/core';
import { Interaction, InteractionFrame } from '@reflex/shared-types';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
  })
export class TouchPointService {
    private _wss: WebSocket;
    private _numFrames = 0;
    private _historyRaw: Array<InteractionFrame> = [];

    private _touchPoints: Subject<Interaction[]> = new Subject<Interaction[]>();
    private _history: Subject<InteractionFrame[]> = new Subject<InteractionFrame[]>();
    private _isConnected = false;
    private _frameNumber: Subject<number> = new Subject<number>();
    
    constructor(@Inject('WEBSOCKET_URL') private _address: string) {
        this._wss = new WebSocket(this._address);
        this.subscribeWebSocketEvents();
    }

    public getTouchPoints() : Observable<Interaction[]> {
        return this._touchPoints;
    }

    public getHistory() : Observable<InteractionFrame[]> {
        return this._history;
    }

    public getAddress(): string {
        return this._address;
    }

    public getFrameNumber(): Observable<number> {
        return this._frameNumber;
    }

    public isConnected(): boolean {
        return this._wss?.readyState == this._wss.OPEN;
    }

    private subscribeWebSocketEvents() {
        var service = this;
        this._wss.onopen = function() {
            console.log("Successfully connected to " + service._address);
            service._isConnected = true;
          };

        // for sake of simplicity: subscribe to websocket event directly
        // better do this with RxJS !
        var service = this;
        this._wss.onmessage = function(evt) {

            service._numFrames++;
            service._frameNumber.next(service._numFrames);
            
            // not the most elegant workaround: convert first letter of JSON property to lowercase
            const lowerCaseStart = evt.data.replace(/"([^"]+)":/g, 
              ($0:string, $1:string) => { return ('"' + $1.charAt(0).toLowerCase() + $1.slice(1) + '":'); });

            // parse data
            var points = JSON.parse(lowerCaseStart);
            
            if (points.length <= 0) {
                service._touchPoints.next([]);
                service._historyRaw.push({ frameId: service._numFrames, interactions: []})
                service._history.next(service._historyRaw);
                return;
            }

            let tp = new Array<Interaction>();

            points.forEach((pt:Interaction) => {
                tp.push(pt);
            });

            service._touchPoints.next(tp);
            service._historyRaw.push({ frameId: service._numFrames, interactions: tp});
            if (service._historyRaw.length > 100) {
                service._historyRaw.splice(0, 1);
            }

            service._history.next(service._historyRaw);
        }

        this._wss.onclose = function() { 
            
            // websocket is closed.
            console.warn(`Connection to ${service._address} is closed...`);
            service._isConnected = false;
          };
    }
}