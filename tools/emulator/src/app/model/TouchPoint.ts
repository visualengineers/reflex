export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface TouchPoint {
    touchid: number;
    position: Position;
    type: number;
    confidence: number;
    time: number;
}
