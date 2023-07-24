import { ExtremumTypeCheckMethod } from './extremum-type-check-method';

export interface ExtremumDescriptionSettings {
  numSamples: number;
  checkRadius: number;
  fitPercentage: number;
  checkMethod: ExtremumTypeCheckMethod;
}
