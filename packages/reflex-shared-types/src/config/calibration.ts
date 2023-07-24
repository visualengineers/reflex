export interface Calibration {

  sourceValues: Array<Array<number>>;
  targetValues: Array<Array<number>>;
  upperThreshold: number;
  lowerThreshold: number;
  lastUpdated: Array<string>;
}
