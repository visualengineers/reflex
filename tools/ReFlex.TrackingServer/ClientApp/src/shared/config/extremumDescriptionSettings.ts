import { ExtremumTypeCheckMethod } from './extremumTypeCheckMethod';

export interface ExtremumDescriptionSettings {
  numSamples: number;
  checkRadius: number;
  fitPercentage: number;
  checkMethod: ExtremumTypeCheckMethod;
}
