import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { BehaviorSubject } from 'rxjs';

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
  gesturePoints$ = this.gesturePointSubject.asObservable();

  constructor() {}

  addPoint(x: number, y: number, z: number): void {
    const newPoint = { x, y, z };
    const currentPoints = this.gesturePointSubject.value;
    this.gesturePointSubject.next([...currentPoints, newPoint]);
  }
}
