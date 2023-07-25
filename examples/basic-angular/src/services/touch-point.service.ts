import { Inject, Injectable } from '@angular/core';
import { Interaction, InteractionType } from '@reflex/shared-types';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })
export class TouchPointService {
    private _wss: WebSocket;

    private _touchPoints: Subject<Interaction[]> = new Subject<Interaction[]>();
    private _isConnected = false;
    
    constructor(@Inject('WEBSOCKET_URL') private _address: string) {
        this._wss = new WebSocket(this._address);
        this.subscribeWebSocketEvents();
    }

    public getTouchPoints() : Observable<Interaction[]> {
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
            
            // not the most elegant workaround: convert first letter of JSON property to lowercase
            const lowerCaseStart = evt.data.replace(/"([^"]+)":/g, 
              ($0:string, $1:string) => { return ('"' + $1.charAt(0).toLowerCase() + $1.slice(1) + '":'); });

            // parse data
            var points = JSON.parse(lowerCaseStart);
            
            if (points.length <= 0) {
                service._touchPoints.next([]);
                return;
            }

            let tp = new Array<Interaction>();

            points.forEach((pt:Interaction) => {
                tp.push(pt);
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