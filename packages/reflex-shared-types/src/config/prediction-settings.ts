export interface PredictionSettings {
  useVelocityPrediction: boolean;
  numFramesForPrediction: number;
  secondDerivationMagnitude: number;
  useSecondDerivation: boolean;
  filterPointsByVelocity: boolean;
  velocityFilterThreshold: number;
}
