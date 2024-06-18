import { Injectable } from '@angular/core';
import { Gesture } from "../data/gesture";
import { ConnectionService } from './connection.service';
import { ConfigurationService } from './configuration.service';
import { interval } from 'rxjs';
import { ExtremumType, Interaction, InteractionType } from '@reflex/shared-types';
import { HttpClient } from '@angular/common/http';
import { TouchAreaComponent } from '../touch-area/touch-area.component';

@Injectable({
  providedIn: 'root'
})
export class GestureReplayService {
  public loopGesture = true;

  private gestureForReplay?: Gesture;
  private currentFrame: number = 0;

  public constructor(
    private readonly connectionService: ConnectionService,
    private readonly configService: ConfigurationService,
    private readonly httpClient: HttpClient)
  {

  }

  public init(gestureFile: string): void {
    this.httpClient.get(gestureFile, { responseType: 'json'}).subscribe({
      next: (result) => {
        const gesture = result as Gesture;
        console.info('successfully loaded gesture: ', gesture);
        this.start(gesture);
      },
      error: (error) => console.error(error)
    })
  }

  private start(gesture: Gesture): void {
    if (gesture === undefined) {
      return;
    }

    this.gestureForReplay = gesture;
    const speed = gesture.speed > 0 ? gesture.speed : 1;
    const i = this.configService.getSendInterval() / speed;

    console.info(`start replay with replay interval of ${i} ms.`);

    interval(i).subscribe({
      next: () => (this.update())
    })
  }

  private update(): void {
    if( this.gestureForReplay === undefined ) {
      return;
    }

    const touches: Array<Interaction> = [];

    this.gestureForReplay.tracks.forEach((track) => {
      if(track.frames.length > this.currentFrame) {
        const item = track.frames[this.currentFrame];
        const touch: Interaction = {
          touchId: track.touchId,
          position: {
            x: item.x,
            y: item.y,
            z: item.z,
            isValid: true,
            isFiltered: false
          },
          type: InteractionType.None,
          extremumDescription: {
            type: ExtremumType.Undefined,
            numFittingPoints: 0,
            percentageFittingPoints: 0
          },
          confidence: 0,
          time: this.currentFrame
        }
        touches.push(touch);
      }
    });

    this.connectionService.sendMessage(touches);

    this.currentFrame = (this.currentFrame + 1);

    if (this.loopGesture) {
      this.currentFrame= this.currentFrame % this.gestureForReplay.numFrames;
    } else if (this.currentFrame > this.gestureForReplay.numFrames) {
      this.currentFrame = this.gestureForReplay.numFrames;
    }
  }
}
