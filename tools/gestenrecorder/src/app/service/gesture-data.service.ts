import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Interaction } from '@reflex/shared-types';

// TODO: Wann wird Interpoliert? Durch ButtonClick oder durch Timer? (stand jetzt durch create-Button in TrackComponent)
// TODO: wenn schon interpoliert und dann noch werte geändert werden, soll die geste nochmal neu interpoliert werden: Großes Problem bisher funkt noch nicht

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
      track.frames[existingFrameIndex].z = newFrame.z;
    } else {
      track.frames.push(newFrame);
    }

    this.gestureSubject.next(currentGesture);
    this.gesturePointSubject.next(track.frames); // Emit the updated gesture data through the gesturePoints$ observable
    console.log("Gesture nach addGestureTrackFrames:",currentGesture);
  }

  deleteGestureTrackFrame(frame: GestureTrackFrame): void {
    if (!frame) {
      return;
    }

    const currentGesture = this.gestureSubject.value;
    const track = currentGesture.tracks[0];

    const index = track.frames.findIndex(f => f.x === frame.x && f.y === frame.y && f.z === frame.z);

    if (index !== -1) {
      track.frames.splice(index, 1);
      this.gestureSubject.next(currentGesture);
    }
    console.log('Gesture after deleteGestureTrackFrame:', currentGesture);
  }

  updateGestureTrackFrame(index: number, x: number, y: number, z: number): void {
    const currentGesture = this.gestureSubject.value;
    const track = currentGesture.tracks[0];

    if (index >= 0 && index < track.frames.length) {
      track.frames[index].x = x;
      track.frames[index].y = y;
      track.frames[index].z = z;

      this.gestureSubject.next(currentGesture);
    }
    console.log('Gesture after updateGestureTrackFrame:', currentGesture);
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

  setGestureTrackFrames(frames: GestureTrackFrame[]): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.tracks[0].frames = frames;
    this.gestureSubject.next(currentGesture);
    this.gesturePointSubject.next(frames);
  }

  getGestureTrackFrames(): GestureTrackFrame[] {
    return this.gestureSubject.value.tracks[0].frames;
  }

  // Interpolation

  public interpolateGesture(): void {
    const currentGesture = this.gestureSubject.value;
    const track = currentGesture.tracks[0];
    const numFrames = currentGesture.numFrames;

    const newFrames: GestureTrackFrame[] = [];

    for (let i = 0; i < track.frames.length - 1; i++) {
      const startFrame = track.frames[i];
      const endFrame = track.frames[i + 1];

      const numInterpolatedFrames = Math.ceil((numFrames - track.frames.length) / (track.frames.length - 1));

      for (let j = 0; j <= numInterpolatedFrames; j++) {
        const t = j / numInterpolatedFrames;
        const interpolatedX = startFrame.x + (endFrame.x - startFrame.x) * t;
        const interpolatedY = startFrame.y + (endFrame.y - startFrame.y) * t;
        const interpolatedZ = startFrame.z + (endFrame.z - startFrame.z) * t;

        newFrames.push({ x: interpolatedX, y: interpolatedY, z: interpolatedZ });
      }
    }

    track.frames = newFrames.slice(0, numFrames); // Trim the array to the desired number of frames

    this.gestureSubject.next(currentGesture);
    console.log("Interpolated Gesture:", currentGesture);
  }
}
