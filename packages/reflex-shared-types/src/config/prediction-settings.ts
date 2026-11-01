export interface PredictionSettings {
  useVelocityPrediction: boolean;
  numFramesForPrediction: number;
  useSecondDerivation: boolean;
  secondDerivationMagnitude: number;
}
