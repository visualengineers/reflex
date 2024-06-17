import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestureDataService {
  private gesturePointSubject = new BehaviorSubject<GestureTrackFrame[]>([]);
  public gesturePoints$: Observable<GestureTrackFrame[]> = this.gesturePointSubject.asObservable();
  private gestureSubject = new BehaviorSubject<Gesture>({
    id: 0,
    name: '',
    numFrames: 0,
    speed: 0,
    tracks: []
  });
  public gesture$: Observable<Gesture> = this.gestureSubject.asObservable();
  private gestureURL = 'assets/data/sampleGesture.json';

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

  addGestureTrackFrame(x: number, y: number, z: number): void {
    const newFrame = {x, y, z};
    const currentGesture = this.gestureSubject.value;
    if ( currentGesture.tracks.length === 0 ) {
      currentGesture.tracks.push({
        touchId: 1,
        frames: []
      });
    }
    currentGesture.tracks[0].frames.push(newFrame);
    this.gestureSubject.next(currentGesture);
    console.log('Gesture nach addGestureTrackFrame:', currentGesture);
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
}
