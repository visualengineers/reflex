import { Injectable } from "@angular/core";
import { Gesture } from "../data/gesture";
import { ConnectionService } from "./connection.service";
import { ConfigurationService } from "./configuration.service";
import { interval } from "rxjs";
import { ExtremumType, Interaction, InteractionType } from "@reflex/shared-types";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root'})
export class GestureReplayService {
  public loopGesture = true;

  private gestureForReplay?: Gesture;
  private currentFrame: number = 0;

  public constructor(private readonly connectionService: ConnectionService, private readonly configService: ConfigurationService, private readonly httpClient: HttpClient) {

  }

  /**
   * load gesture from json file and start replay when loading was successful
   * @param gestureFile path to local json file with the stored gesture data
   */
  public init(gestureFile: string): void {
    this.httpClient.get(gestureFile, { responseType: 'json' }).subscribe({
      next: (result) => {
        const gesture = result as Gesture;
        console.info('successfully loaded gesture: ', gesture);
        this.start(gesture);
      },
      error: (error) => console.error(error)
    });
  }

  /**
   * computes interval for sending data based on @see Gesture.speed
   * starts @see interval subscription with the computed interval.
   * @param gesture gesture which will be replayed
   */
  private start(gesture: Gesture): void {
    if (gesture === undefined) {
      return;
    }

    this.gestureForReplay = gesture;
    const speed = gesture.speed > 0 ? gesture.speed : 1;
    const i = this.configService.getSendInterval() / speed;

    console.info(`start replay with replay interval of ${i} ms.` );

    interval(i).subscribe({
      next: () => (this.update())
    })
  }

  /**
   * retrieves @see GestureTrackFrame associated with @see currentFrame from @see gestureForReplay.
   * constructs @see Interaction from frame data and sends this using @see connectionService.sendMessage
   * increments @see currentFrame and resets is (using modulo) if @see loopGesture is true.
   */
  private update(): void {
    if (this.gestureForReplay === undefined) {
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
        }
        touches.push(touch);
      }
    });

    this.connectionService.sendMessage(touches);

    //advance to next frame
    this.currentFrame = (this.currentFrame + 1);

    if (this.loopGesture) {
      this.currentFrame = this.currentFrame % this.gestureForReplay.numFrames;
    } else if (this.currentFrame > this.gestureForReplay.numFrames) {
      this.currentFrame = this.gestureForReplay.numFrames;
    }
  }
}
