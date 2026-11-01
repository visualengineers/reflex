export interface PredictionSettings {
  predictionHorizonSeconds: number;
  useVelocityPrediction: boolean;
  numFramesForPrediction: number;
  useSecondDerivation: boolean;
  secondDerivationMagnitude: number;
}
