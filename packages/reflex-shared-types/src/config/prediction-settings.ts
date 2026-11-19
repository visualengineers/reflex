export interface PredictionSettings {
  predictionHorizonSeconds: number;
  useVelocityPrediction: boolean;
  /** Requested capacity, preserved when the tracking history temporarily permits fewer samples. */
  numFramesForPrediction: number;
  useSecondDerivation: boolean;
  secondDerivationMagnitude: number;
}
