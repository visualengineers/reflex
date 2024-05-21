import { GestureTrackFrame } from "../data/gesture-track-frame";

export interface GestureTrack {
    touchId: number,
    frames: Array<GestureTrackFrame>
}