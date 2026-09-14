import { GestureTrackFrame } from "./gesture-track-frame";

export interface GestureTrack {
    touchId: number,
    frames: Array<GestureTrackFrame>
}
