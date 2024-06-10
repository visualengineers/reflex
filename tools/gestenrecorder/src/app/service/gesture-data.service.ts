import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MinValidator } from '@angular/forms';

interface Frame {
  x: number;
  y: number;
  z: number;
}

interface Track {
  touchId: number;
  frames: Frame[];
}

interface Gesture {
  id: number;
  name: string;
  numFrames: number;
  speed: number;
  tracks: Track[];
}

@Injectable({
  providedIn: 'root'
})
export class GestureDataService {
  private gesturesURL = 'assets/data/sampleGesture.json';
  private gesturesSubject = new BehaviorSubject<Gesture[]>([]);
  gestures$ = this.gesturesSubject.asObservable();

  constructor(private http: HttpClient) { }

  loadGestures(): void {
    this.http.get<Gesture[]>(this.gesturesURL).subscribe(data => {
      this.gesturesSubject.next(data);
    })
  }

  getGesture(id: number): Observable<Gesture | undefined> {
    return this.gestures$.pipe(
      map((gestures: Gesture[]) => gestures.find(gesture => gesture.id === id))
    );
  }

  addGesture(newGesture: Gesture): void {
    const gestures = this.gesturesSubject.getValue();
    this.gesturesSubject.next([...gestures, newGesture]);
  }

  updateGesture(updatedGesture: Gesture): void {
    const gestures = this.gesturesSubject.getValue();
    const index = gestures.findIndex(gesture => gesture.id === updatedGesture.id);
    if ( index !== -1 ) {
      gestures[index] = updatedGesture;
      this.gesturesSubject.next([...gestures]);
    }
  }

  deleteGesture(id: number): void {
    const gestures = this.gesturesSubject.getValue();
    const updatedGestures = gestures.filter(gesture => gesture.id !== id);
    this.gesturesSubject.next(updatedGestures);
  }

  normalizeAndRound(z: number, min: number, max: number): number {
    const normalized = ((z + 1) / 2) * (max - min) + min;
    return Math.round(normalized);
  }

  processGestureData(gesture: Gesture, minValueLayer: number, maxValueLayer: number): any {
    const frames = gesture.tracks[0].frames;
    const numFrames = gesture.numFrames;
    const frameIndices = Array.from({ length: numFrames }, (_, i) => i);
    const normalizedFrames = frames.map(frame => ({
      ...frame,
      z: this.normalizeAndRound(frame.z, minValueLayer, maxValueLayer)
    }));
    const zValues = normalizedFrames.map(frame => frame.z);
    return { frameIndices, zValues, normalizedFrames };
  }
}
