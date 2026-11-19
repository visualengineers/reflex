import { ExtremumTypeCheckMethod } from './extremum-type-check-method';

export interface ExtremumDescriptionSettings {
  numSamples: number;
  checkRadius: number;
  /** Euclidean radius in sensor pixels; absent legacy values use 3, zero disables consolidation. */
  mergeRadius?: number;
  fitPercentage: number;
  checkMethod: ExtremumTypeCheckMethod;
}
