import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';

interface GesturePoint {
  x: number;
  y: number;
  z: number;
}
@Injectable({
  providedIn: 'root'
})
export class GestureDataService {
  private currentGestureFrames: GestureTrackFrame[] = [];

  constructor() {}

  addPoint(x: number, y: number, z: number): void {
    const newFrame: GestureTrackFrame = { x, y, z };
    this.currentGestureFrames.push(newFrame);
  }

  getCurrentGestureFrames(): GestureTrackFrame[] {
    return this.currentGestureFrames;
  }

  clearCurrectGestureFrames(): void {
    this.currentGestureFrames = [];
  }
}
