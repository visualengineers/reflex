import { GestureTrack } from "./gesture-track";

export interface Gesture {
    id: number,
    name: string,
    numFrames: number,
    speed: number,
    tracks: Array<GestureTrack>
}
