import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Interaction } from '@reflex/shared-types';
import { saveAs } from 'file-saver';
import { BehaviorSubject, Observable } from 'rxjs';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';

// TODO: Wann wird Interpoliert? Durch ButtonClick oder durch Timer? (stand jetzt durch create-Button in TrackComponent)
// TODO: wenn schon interpoliert und dann noch werte geändert werden, soll die geste nochmal neu interpoliert werden: Großes Problem bisher funkt noch nicht

@Injectable({
  providedIn: 'root'
})
export class GestureDataService {
  public readonly gesturePoints$: Observable<Array<GestureTrackFrame>>;

  public readonly gesture$: Observable<Gesture>;
  private readonly http = inject(HttpClient);

  private readonly gesturePointSubject = new BehaviorSubject<Array<GestureTrackFrame>>([]);

  private readonly gestureSubject = new BehaviorSubject<Gesture>({
    id: 1,
    name: 'FirstGesture',
    numFrames: 30,
    speed: 1,
    tracks: [{ touchId: 1, frames: [] }]
  });

  private readonly fixedFrameIndices = new Set<number>();

  public constructor() {
    this.gesturePoints$ = this.gesturePointSubject.asObservable();
    this.gesture$ = this.gestureSubject.asObservable();
  }

  public updateGesture(
    id: number,
    name: string,
    numFrames: number,
    speed: number
  ): void {
    const currentGesture = this.gestureSubject.value;

    if (id !== undefined) {
      currentGesture.id = id;
    }
    if (name !== undefined) {
      currentGesture.name = name;
    }
    if (numFrames !== undefined) {
      currentGesture.numFrames = numFrames;
    }
    if (speed !== undefined) {
      currentGesture.speed = speed;
    }
    this.gestureSubject.next(currentGesture);
  }

  public addGestureTrackFrame(interaction: Interaction): void {
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

    const [track] = currentGesture.tracks;
    const existingFrameIndex = track.frames.findIndex(
      (frame) => frame.x === newFrame.x && frame.y === newFrame.y
    );

    if (existingFrameIndex !== -1) {
      track.frames[existingFrameIndex].z = newFrame.z;
      this.fixedFrameIndices.add(existingFrameIndex); // Mark the index as fixed
    } else {
      track.frames.push(newFrame);
      this.fixedFrameIndices.add(track.frames.length - 1); // Mark the new index as fixed
    }

    this.gestureSubject.next(currentGesture);
    this.gesturePointSubject.next(track.frames); // Emit the updated gesture data through the gesturePoints$ observable
    console.log('Gesture nach addGestureTrackFrames:', currentGesture);
    console.log('FixedFrames', this.fixedFrameIndices);
  }

  // Delete the frame and update fixedFrameIndices
  public deleteGestureTrackFrame(frame: GestureTrackFrame): void {
    if (frame === undefined) {
      return;
    }

    const currentGesture = this.gestureSubject.value;
    const [track] = currentGesture.tracks;

    const index = track.frames.findIndex(
      (f) => f.x === frame.x && f.y === frame.y && f.z === frame.z
    );

    if (index !== -1) {
      track.frames.splice(index, 1);
      this.fixedFrameIndices.delete(index); // Remove from fixed frames
      this.gestureSubject.next(currentGesture);
    }
    console.log('Gesture after deleteGestureTrackFrame:', currentGesture);
  }

  public updateGestureTrackFrame(
    index: number,
    x: number,
    y: number,
    z: number
  ): void {
    const currentGesture = this.gestureSubject.value;
    const [track] = currentGesture.tracks;

    if (index >= 0 && index < track.frames.length) {
      track.frames[index].x = x;
      track.frames[index].y = y;
      track.frames[index].z = z;

      // Mark the updated frame as fixed
      this.fixedFrameIndices.add(index);

      // Remove any frames after the updated frame from fixedFrameIndices
      for (let i = index + 1; i < track.frames.length; i++) {
        this.fixedFrameIndices.delete(i);
      }

      this.gestureSubject.next(currentGesture);
    }
    console.log('Gesture after updateGestureTrackFrame:', currentGesture);
  }

  // set- und get-Methoden

  public setGesture(gesture: Gesture): void {
    this.gestureSubject.next(gesture);
  }

  public getGesture(): Gesture {
    return this.gestureSubject.value;
  }

  public getGestureId(): number {
    return this.gestureSubject.value.id;
  }

  public setGestureId(id: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.id = id;
    this.gestureSubject.next(currentGesture);
  }

  public getGestureName(): string {
    return this.gestureSubject.value.name;
  }

  public setGestureName(name: string): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.name = name;
    this.gestureSubject.next(currentGesture);
  }

  public getGestureNumFrames(): number {
    return this.gestureSubject.value.numFrames;
  }

  public setGestureNumFrames(numFrames: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.numFrames = numFrames;
    this.gestureSubject.next(currentGesture);
  }

  public getGestureSpeed(): number {
    return this.gestureSubject.value.speed;
  }

  public setGestureSpeed(speed: number): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.speed = speed;
    this.gestureSubject.next(currentGesture);
  }

  public getGestureTracks(): Array<GestureTrack> {
    return this.gestureSubject.value.tracks;
  }

  public setGestureTracks(tracks: Array<GestureTrack>): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.tracks = tracks;
    this.gestureSubject.next(currentGesture);
  }

  public setGestureTrackFrames(frames: Array<GestureTrackFrame>): void {
    const currentGesture = this.gestureSubject.value;
    currentGesture.tracks[0].frames = frames;
    this.gestureSubject.next(currentGesture);
    this.gesturePointSubject.next(frames);
  }

  public getGestureTrackFrames(): Array<GestureTrackFrame> {
    return this.gestureSubject.value.tracks[0].frames;
  }

  // Interpolation

  public interpolateGesture(): void {
    const currentGesture = this.gestureSubject.value;
    const [track] = currentGesture.tracks;
    const { numFrames } = currentGesture;

    // Keep only the frames that were set in the TouchArea
    const fixedFrames = track.frames.filter((frame, index) =>
      this.fixedFrameIndices.has(index));

    // If there are less than 2 fixed frames, interpolation cannot be performed
    if (fixedFrames.length < 2) {
      console.warn('Not enough fixed frames to interpolate');

      return;
    }

    const newFrames: Array<GestureTrackFrame> = [];
    const totalFixedFrames = fixedFrames.length;

    // Number of frames between the fixed points
    const framesPerSegment = Math.floor(
      (numFrames - 1) / (totalFixedFrames - 1)
    );

    let frameIndex = 0;
    for (let i = 0; i < totalFixedFrames - 1; i++) {
      const startFrame = fixedFrames[i];
      const endFrame = fixedFrames[i + 1];

      // Add the start frame of the segment
      newFrames.push(startFrame);

      // Interpolate the frames between the current fixed frame and the next fixed frame
      for (let j = 1; j < framesPerSegment; j++) {
        const t = j / framesPerSegment; // T-value for interpolation

        const interpolatedX = startFrame.x + ((endFrame.x - startFrame.x) * t);
        const interpolatedY = startFrame.y + ((endFrame.y - startFrame.y) * t);
        const interpolatedZ = startFrame.z + ((endFrame.z - startFrame.z) * t);

        newFrames.push({
          x: interpolatedX,
          y: interpolatedY,
          z: interpolatedZ
        });
      }

      // Insert the interpolated frames between the current fixed frame and the next fixed frame
      const nextFixedFrameIndex = Array.from(this.fixedFrameIndices)[i + 1];
      track.frames.splice(
        frameIndex + 1,
        nextFixedFrameIndex - frameIndex - 1,
        ...newFrames.slice(frameIndex + 1)
      );
      frameIndex += framesPerSegment;
    }

    // Ensure that the number of frames is exactly `numFrames`
    const interpolatedFrames = track.frames.slice(0, numFrames);

    track.frames = interpolatedFrames;

    // Update the fixedFrameIndices set
    this.fixedFrameIndices.clear();
    for (let i = 0; i < totalFixedFrames; i++) {
      this.fixedFrameIndices.add(i * framesPerSegment);
    }

    this.gestureSubject.next(currentGesture);
    this.gesturePointSubject.next(interpolatedFrames);
    console.log('Interpolated Gesture:', currentGesture);
    console.log('fixedFrames', fixedFrames);
  }

  public saveGestureToJson(): void {
    const gesture = this.gestureSubject.value;
    const jsonString = JSON.stringify(gesture, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const suggestedName = `${gesture.name}.json`;
    saveAs(blob, suggestedName);
  }

  public loadGestureFromFile(gestureFile: string): void {
    this.http.get(gestureFile, { responseType: 'json' }).subscribe({
      next: (result) => {
        const gesture = result as Gesture;
        console.log('Loaded Gesture:', gesture);
        if (this.isValidGesture(gesture)) {
          this.gestureSubject.next(gesture);
          console.info('Successfully loaded and set gesture:', gesture);
        } else {
          console.error('Invalid gesture format');
        }
      },
      error: (error) => console.error('Error loading gesture:', error)
    });
  }

  public getGestureFileNames(): Observable<Array<string>> {
    const url = 'assets/data/gestures.json';

    return this.http.get<Array<string>>(url);
  }

  private isValidGesture(json: unknown): json is Gesture {
    return (
      typeof json === 'object'
      && json !== null
      && 'id' in json && 'name' in json && 'numFrames' in json && 'speed' in json && 'tracks' in json
      && typeof json.id === 'number'
      && typeof json.name === 'string'
      && typeof json.numFrames === 'number'
      && typeof json.speed === 'number'
      && Array.isArray(json.tracks)
      && json.tracks.every(
        (track: unknown) =>
          typeof track === 'object' && track !== null && 'touchId' in track && 'frames' in track
          && typeof track.touchId === 'number'
          && Array.isArray(track.frames)
          && track.frames.every(
            (frame: unknown) =>
              typeof frame === 'object' && frame !== null && 'x' in frame && 'y' in frame && 'z' in frame
              && typeof frame.x === 'number'
              && typeof frame.y === 'number'
              && typeof frame.z === 'number'
          )
      )
    );
  }
}
