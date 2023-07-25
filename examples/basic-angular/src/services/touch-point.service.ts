import { Inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TouchPoint } from 'src/shared/touch-point';
import { WebServiceTouchpoint } from 'src/shared/webservice-touchpoint';

@Injectable({
    providedIn: 'root'
  })
export class TouchPointService {
    private _wss: WebSocket;

    private _touchPoints: Subject<TouchPoint[]> = new Subject<TouchPoint[]>();
    private _isConnected = false;
    
    constructor(@Inject('WEBSOCKET_URL') private _address: string) {
        this._wss = new WebSocket(this._address);
        this.subscribeWebSocketEvents();
    }

    public getTouchPoints() : Observable<TouchPoint[]> {
        return this._touchPoints;
    }

    public getAddress(): string {
        return this._address;
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
            
            // parse data
            var points = JSON.parse(evt.data);
            
            if (points.length <= 0) {
                service._touchPoints.next([]);
                return;
            }

            let tp = new Array<TouchPoint>();

            points.forEach((pt:WebServiceTouchpoint) => {
                tp.push( {
                    touchId: pt.TouchId,
                    posX: pt.Position.X,
                    posY: pt.Position.Y,
                    posZ: pt.Position.Z
                });
            });

            service._touchPoints.next(tp); 
        }

        this._wss.onclose = function() { 
            
            // websocket is closed.
            console.warn(`Connection to ${service._address} is closed...`);
            service._isConnected = false;
          };
    }
}