import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Interaction } from '@reflex/shared-types';

// TODO: Wann wird Interpoliert? Durch ButtonClick oder durch Timer?

@Injectable({
  providedIn: 'root'
})
export class GestureDataService {
  private gesturePointSubject = new BehaviorSubject<GestureTrackFrame[]>([]);
  public gesturePoints$: Observable<GestureTrackFrame[]> = this.gesturePointSubject.asObservable();
  private gestureSubject = new BehaviorSubject<Gesture>({
    id: 1,
    name: 'FirstGesture',
    numFrames: 30,
    speed: 1,
    tracks: [{ touchId: 1, frames: [] }]
  });
  public gesture$: Observable<Gesture> = this.gestureSubject.asObservable();
  private gestureURL = 'assets/data/sampleGesture.json';
  // kann raus wenn nicht mehr über Timer interpoliert werden soll
  private lastPointSetTime: number | null = null;

  constructor(
    private http: HttpClient
  ) {}

  updateGesture(id: number, name: string, numFrames: number, speed: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.id = id;
    currentGesture.name = name;
    currentGesture.numFrames = numFrames;
    currentGesture.speed = speed;
    this.gestureSubject.next(currentGesture);
  }

  addGestureTrackFrame(interaction: Interaction): void {
    const newFrame = {
      x: interaction.position.x,
      y: interaction.position.y,
      z: interaction.position.z
    };

    const currentGesture = this.gestureSubject.value;

    if (currentGesture.tracks.length === 0) {
      currentGesture.tracks.push({
        touchId: interaction.touchId,
        frames: []
      });
    }

    const track = currentGesture.tracks[0];
    const existingFrameIndex = track.frames.findIndex(frame => frame.x === newFrame.x && frame.y === newFrame.y);

    if (existingFrameIndex !== -1) {
      // Update the z-coordinate of the existing frame
      track.frames[existingFrameIndex].z = newFrame.z;
    } else {
      // Add a new frame to the gesture track
      track.frames.push(newFrame);
    }

    this.gestureSubject.next(currentGesture);
    console.log('Gesture nach addGestureTrackFrame:', currentGesture);
  }



  deleteGestureTrackFrame(index: number): void {
    const currentGesture = this.gestureSubject.value;
    const track = currentGesture.tracks[0];

    if ( index >= 0 && index < track.frames.length ) {
      track.frames.splice(index, 1);
      this.gestureSubject.next(currentGesture);
    }
    console.log('Gesture nach deleteGestureTrackFrame:', currentGesture);
  }

  updateGestureTrackFrame(x: number, y: number, z: number): void {
    const currentGesture = this.gestureSubject.value;
    const track = currentGesture.tracks[0]; // Annahme, dass es nur eine GestureTrack gibt

    const frameIndex = track.frames.findIndex(frame => frame.x === x && frame.y === y);

    if (frameIndex !== -1) {
      // Aktualisiere die z-Koordinate des vorhandenen GestureTrackFrame
      track.frames[frameIndex].z = z;

      // Speichere die aktualisierte Gesture
      this.gestureSubject.next(currentGesture);
    }
    console.log('Gesture nach updateGestureTrackFrame:', currentGesture);
  }

// set- und get-Methoden

  setGesture(gesture: Gesture): void {
    this.gestureSubject.next(gesture);
  }

  getGesture(): Gesture {
    return this.gestureSubject.value;
  }

  getGestureId(): number {
    return this.gestureSubject.value.id;
  }

  setGestureId(id: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.id = id;
    this.gestureSubject.next(currentGesture);
  }

  getGestureName(): string {
    return this.gestureSubject.value.name;
  }

  setGestureName(name: string): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.name = name;
    this.gestureSubject.next(currentGesture);
  }

  getGestureNumFrames(): number {
    return this.gestureSubject.value.numFrames;
  }

  setGestureNumFrames(numFrames: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.numFrames = numFrames;
    this.gestureSubject.next(currentGesture);
  }

  getGestureSpeed(): number {
    return this.gestureSubject.value.speed;
  }

  setGestureSpeed(speed: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.speed = speed;
    this.gestureSubject.next(currentGesture);
  }

  getGestureTracks(): GestureTrack[] {
    return this.gestureSubject.value.tracks;
  }

  setGestureTracks(tracks: GestureTrack[]): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.tracks = tracks;
    this.gestureSubject.next(currentGesture);
  }

  // Interpolation

  public interpolateGesture(): void {
    const currentGesture = this.gestureSubject.value;
    const track = currentGesture.tracks[0];
    const numFrames = currentGesture.numFrames;

    const numInterpolatedFrames = Math.ceil((track.frames.length - 1) * (numFrames - 1) / (track.frames.length - 1));
    const stepSize = 1 / numInterpolatedFrames;
    const interpolatedFrames: GestureTrackFrame[] = [];

    for (let i = 0; i < track.frames.length - 1; i++) {
      const startFrame = track.frames[i];
      const endFrame = track.frames[i + 1];
      const numSteps = Math.ceil(numInterpolatedFrames / (track.frames.length - 1));

      for (let j = 1; j < numSteps; j++) {
        const t = j / numSteps;
        const interpolatedX = startFrame.x + (endFrame.x - startFrame.x) * t;
        const interpolatedY = startFrame.y + (endFrame.y - startFrame.y) * t;
        const interpolatedZ = startFrame.z + (endFrame.z - startFrame.z) * t;

        interpolatedFrames.push({ x: interpolatedX, y: interpolatedY, z: interpolatedZ });
      }
    }

    const newFrames = [];
    let numNewFrames = 0;
    for (let i = 0; i < track.frames.length; i++) {
      if (i > 0) {
        const numInterpolatedFramesToAdd = Math.min(Math.ceil(numInterpolatedFrames / (track.frames.length - 1)), numFrames - numNewFrames);
        newFrames.push(...interpolatedFrames.splice(0, numInterpolatedFramesToAdd));
        numNewFrames += numInterpolatedFramesToAdd;
      }
      newFrames.push(track.frames[i]);
      numNewFrames++;
      if (numNewFrames === numFrames) {
        break;
      }
    }
    track.frames = newFrames;

    this.gestureSubject.next(currentGesture);
    console.log("Interpolated Gesture:", currentGesture);
  }

  // kann raus wenn nicht mehr über Timer interpoliert werden soll
  private startInterpolationTimer(): void {
    if (this.lastPointSetTime !== null) {
      setTimeout(() => {
        if (this.lastPointSetTime !== null && Date.now() - this.lastPointSetTime >= 10000) {
          this.interpolateGesture();
        }
      }, 10000);
    }
  }
}
