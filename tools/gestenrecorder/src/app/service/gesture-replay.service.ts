import { Injectable } from '@angular/core';
import { Gesture } from "../data/gesture";
import { ConnectionService } from './connection.service';
import { ConfigurationService } from './configuration.service';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { ExtremumType, Interaction, InteractionType } from '@reflex/shared-types';
import { HttpClient } from '@angular/common/http';
import { GestureTrackFrame } from '../data/gesture-track-frame';

@Injectable({
  providedIn: 'root'
})
export class GestureReplayService {
  public loopGesture = true;

  private gestureForReplay?: Gesture;
  private currentFrame: number = 0;
  private playbackFrameSubject = new BehaviorSubject<GestureTrackFrame | null>(null);
  playbackFrame$ = this.playbackFrameSubject.asObservable();
  private animationSubscription?: Subscription;

  public constructor(
    private readonly connectionService: ConnectionService,
    private readonly configService: ConfigurationService,
    private readonly httpClient: HttpClient)
  { }

  public initFile(gestureFile: string): void {
    this.httpClient.get(gestureFile, { responseType: 'json'}).subscribe({
      next: (result) => {
        const gesture = result as Gesture;
        console.log("Gesture via file:",gesture);
        console.info('successfully loaded gesture: ', gesture);
        this.start(gesture);
      },
      error: (error) => console.error(error)
    })
  }

  public initGestureObject(gesture: Gesture): void {
    this.start(gesture);
  }

  public resetAnimation(gesture: Gesture): void {
    this.currentFrame = 0;
    if (this.animationSubscription) {
      this.animationSubscription.unsubscribe();
    }
    this.update()
  }

  public resetAnimationAfterOneLoop(gesture: Gesture): void {
    if (this.gestureForReplay) {
      const totalFrames = this.gestureForReplay.numFrames;

      this.animationSubscription = interval(this.configService.getSendInterval()).subscribe({
        next: () => {
          if (this.currentFrame == totalFrames) {
            this.resetAnimation(gesture);
          } else {
            this.update();
          }
        }
      });
    }
  }


  private start(gesture: Gesture): void {
    if (gesture === undefined) {
      console.log("returned cause gesture undefined in replay-service.start(gesture)");
      return;
    }

    this.gestureForReplay = gesture;
    const speed = gesture.speed > 0 ? gesture.speed : 1;
    const i = this.configService.getSendInterval() / speed;
    console.log("gestureForReplay:",this.gestureForReplay);

    console.info(`start replay with replay interval of ${i} ms.`);

    this.animationSubscription = interval(i).subscribe({
      next: () => (this.update())
    });
  }

  private update(): void {
    if (this.gestureForReplay === undefined) {
      console.log("gestureForReplay undefined");
      return;
    }

    const touches: Array<Interaction> = [];

    this.gestureForReplay.tracks.forEach((track) => {
      if (track.frames.length > this.currentFrame) {
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
        };
        this.playbackFrameSubject.next({
          x: touch.position.x / this.configService.getViewPort().width,
          y: touch.position.y / this.configService.getViewPort().height,
          z: touch.position.z
        });
        touches.push(touch);
      }
    });

    this.connectionService.sendMessage(touches);

    this.currentFrame = (this.currentFrame + 1);

    if (this.loopGesture) {
      this.currentFrame = this.currentFrame % this.gestureForReplay.numFrames;
    } else if (this.currentFrame >= this.gestureForReplay.numFrames) {
      this.currentFrame = this.gestureForReplay.numFrames - 1;
    }
  }
}
