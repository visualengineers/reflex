import { Injectable } from '@angular/core';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Interaction } from '@reflex/shared-types';
import { saveAs } from 'file-saver';
import { map } from 'rxjs';

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

  private fixedFrameIndices = new Set<number>(); // Indices of fixed frames

  constructor(
    private http: HttpClient
  ) {}

  updateGesture(id: number, name: string, numFrames: number, speed: number): void {
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
        this.fixedFrameIndices.add(existingFrameIndex); // Mark the index as fixed
    } else {
        track.frames.push(newFrame);
        this.fixedFrameIndices.add(track.frames.length - 1); // Mark the new index as fixed
    }

    this.gestureSubject.next(currentGesture);
    this.gesturePointSubject.next(track.frames); // Emit the updated gesture data through the gesturePoints$ observable
    console.log("Gesture nach addGestureTrackFrames:", currentGesture);
    console.log("FixedFrames",this.fixedFrameIndices);
  }

  // Delete the frame and update fixedFrameIndices
  deleteGestureTrackFrame(frame: GestureTrackFrame): void {
      if (!frame) {
          return;
      }

      const currentGesture = this.gestureSubject.value;
      const track = currentGesture.tracks[0];

      const index = track.frames.findIndex(f => f.x === frame.x && f.y === frame.y && f.z === frame.z);

      if (index !== -1) {
          track.frames.splice(index, 1);
          this.fixedFrameIndices.delete(index); // Remove from fixed frames
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

    // Keep only the frames that were set in the TouchArea
    const fixedFrames = track.frames.filter((_, index) => this.fixedFrameIndices.has(index));

    // If there are less than 2 fixed frames, interpolation cannot be performed
    if (fixedFrames.length < 2) {
        console.warn('Not enough fixed frames to interpolate');
        return;
    }

    const newFrames: GestureTrackFrame[] = [];
    const totalFixedFrames = fixedFrames.length;

    // Number of frames between the fixed points
    const framesPerSegment = Math.floor((numFrames - 1) / (totalFixedFrames - 1));

    let frameIndex = 0;
    for (let i = 0; i < totalFixedFrames - 1; i++) {
        const startFrame = fixedFrames[i];
        const endFrame = fixedFrames[i + 1];

        // Add the start frame of the segment
        newFrames.push(startFrame);

        // Interpolate the frames between the current fixed frame and the next fixed frame
        for (let j = 1; j < framesPerSegment; j++) {
            const t = j / framesPerSegment; // T-value for interpolation

            const interpolatedX = startFrame.x + (endFrame.x - startFrame.x) * t;
            const interpolatedY = startFrame.y + (endFrame.y - startFrame.y) * t;
            const interpolatedZ = startFrame.z + (endFrame.z - startFrame.z) * t;

            newFrames.push({ x: interpolatedX, y: interpolatedY, z: interpolatedZ });
        }

        // Insert the interpolated frames between the current fixed frame and the next fixed frame
        const nextFixedFrameIndex = Array.from(this.fixedFrameIndices)[i + 1];
        track.frames.splice(frameIndex + 1, nextFixedFrameIndex - frameIndex - 1, ...newFrames.slice(frameIndex + 1));
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
    console.log("Interpolated Gesture:", currentGesture);
    console.log("fixedFrames",fixedFrames);
  }

  public saveGestureToJson(): void {
    const gesture = this.gestureSubject.value;
    const jsonString = JSON.stringify(gesture, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const suggestedName = `${gesture.name}.json`;
    saveAs(blob, suggestedName);
  }

  public loadGestureFromFile(gestureFile: string): void {
    this.http.get(gestureFile, { responseType: 'json'}).subscribe({
      next: (result) => {
        const gesture = result as Gesture;
        console.log("Loaded Gesture:",gesture);
        if(this.isValidGesture(gesture)) {
          this.gestureSubject.next(gesture);
          console.info('Successfully loaded and set gesture:',gesture);
        } else {
          console.error('Invalid gesture format');
        }
      },
      error: (error) => console.error('Error loading gesture:', error)
    });
  }

  private isValidGesture(json: any): json is Gesture {
    return (
      json &&
      typeof json.id === 'number' &&
      typeof json.name === 'string' &&
      typeof json.numFrames === 'number' &&
      typeof json.speed === 'number' &&
      Array.isArray(json.tracks) &&
      json.tracks.every((track: any) =>
        typeof track.touchId === 'number' &&
        Array.isArray(track.frames) &&
        track.frames.every((frame: any) =>
          typeof frame.x === 'number' &&
          typeof frame.y === 'number' &&
          typeof frame.z === 'number'
        )
      )
    );
  }

  public getGestureFileNames(): Observable<string[]> {
    const url = 'assets/data/gestures.json';
    return this.http.get<string[]>(url);
  }
}
