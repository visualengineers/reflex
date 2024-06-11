import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GesturePoint {
  x: number;
  y: number;
  z: number;
}
@Injectable({
  providedIn: 'root'
})
export class GestureDataService {
  private gesturePointSubject = new BehaviorSubject<GesturePoint[]>([]);
  public gesturePoints$: Observable<GesturePoint[]> = this.gesturePointSubject.asObservable();
  private gestureURL = 'assets/data/sampleGesture.json';

  constructor(
    private http: HttpClient
  ) {}

  addPoint(x: number, y: number, z: number): void {
    const newPoint = { x, y, z };
    const currentPoints = this.gesturePointSubject.value;
    this.gesturePointSubject.next([...currentPoints, newPoint]);
  }

  setPoints(points: GesturePoint[]) {
    this.gesturePointSubject.next(points);
  }

  getPoints(): GesturePoint[] {
    return this.gesturePointSubject.value;
  }

  load(): Observable<Gesture> {
    return this.http.get<Gesture>(this.gestureURL);
  }

  export(id: number, name: string, numFrames: number, speed: number, touchId: number) {
    const gestureData = {
      id,
      name,
      numFrames,
      speed,
      tracks: [
        {
          touchId,
          frames: this.getPoints()
        }
      ]
    };

  }
}
