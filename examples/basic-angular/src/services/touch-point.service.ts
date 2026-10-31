import { Injectable, InjectionToken, inject } from '@angular/core';
import { Interaction, InteractionFrame } from '@reflex/shared-types';
import { Observable, Subject } from 'rxjs';

export const WEBSOCKET_URL = new InjectionToken<string>('WEBSOCKET_URL');

@Injectable({
  providedIn: 'root'
})
export class TouchPointService {
  private readonly address = inject(WEBSOCKET_URL);

  private readonly wss: WebSocket;
  private numFrames = 0;
  private readonly historyRaw: Array<InteractionFrame> = [];

  private readonly touchPoints: Subject<Array<Interaction>> = new Subject<Array<Interaction>>();
  private readonly history: Subject<Array<InteractionFrame>> = new Subject<
    Array<InteractionFrame>
  >();

  private readonly frameNumber: Subject<number> = new Subject<number>();

  public constructor() {
    this.wss = new WebSocket(this.address);
    this.subscribeWebSocketEvents();
  }

  public getTouchPoints(): Observable<Array<Interaction>> {
    return this.touchPoints;
  }

  public getHistory(): Observable<Array<InteractionFrame>> {
    return this.history;
  }

  public getAddress(): string {
    return this.address;
  }

  public getFrameNumber(): Observable<number> {
    return this.frameNumber;
  }

  public isConnected(): boolean {
    return this.wss?.readyState === this.wss.OPEN;
  }

  private subscribeWebSocketEvents(): void {
    this.wss.onopen = (): void => {
      console.log(`Successfully connected to ${this.address}`);
    };

    // for sake of simplicity: subscribe to websocket event directly
    // better do this with RxJS !
    this.wss.onmessage = (evt: MessageEvent<string>): void => {
      this.numFrames++;
      this.frameNumber.next(this.numFrames);

      // not the most elegant workaround: convert first letter of JSON property to lowercase
      const lowerCaseStart = evt.data.replace(
        /"(?<property>[^"]+)":/g,
        ($0: string, $1: string) => `"${$1.charAt(0).toLowerCase()}${$1.slice(1)}":`
      );

      // parse data
      const points = JSON.parse(lowerCaseStart) as Array<Interaction>;

      if (points.length <= 0) {
        this.touchPoints.next([]);
        this.historyRaw.push({
          frameId: this.numFrames,
          interactions: []
        });
        this.history.next(this.historyRaw);

        return;
      }

      const tp = new Array<Interaction>();

      points.forEach((pt: Interaction) => {
        tp.push(pt);
      });

      this.touchPoints.next(tp);
      this.historyRaw.push({
        frameId: this.numFrames,
        interactions: tp
      });
      if (this.historyRaw.length > 100) {
        this.historyRaw.splice(0, 1);
      }

      this.history.next(this.historyRaw);
    };

    this.wss.onclose = (): void => {
      // websocket is closed.
      console.warn(`Connection to ${this.address} is closed...`);
    };
  }
}
