import { Border } from './border';
import { Distance } from './distance';
import { ConfidenceParameter } from './confidence-parameter';
import { SmoothingParameter } from './smoothing-parameter';
import { ExtremumDescriptionSettings } from './extremum-description-settings';
import { LimitationFilterType } from './limitation-flter-type';

export interface FilterSettings {

  threshold: number;
  borderValue: Border;
  minDistanceFromSensor: number;
  limitationFilterType: LimitationFilterType;
  advancedLimitationFilterThreshold: number;
  advancedLimitationFilterSamples: number;
  isLimitationFilterEnabled: boolean;
  isValueFilterEnabled: boolean;
  isThresholdFilterEnabled: boolean;
  isBoxFilterEnabled: boolean;
  measurePerformance: boolean;
  useOptimizedBoxFilter: boolean;
  boxFilterRadius: number;
  boxFilterNumPasses: number;
  boxFilterNumThreads: number;
  distanceValue: Distance;
  confidence: ConfidenceParameter;
  minAngle: number;
  smoothingValues: SmoothingParameter;
  extremumSettings: ExtremumDescriptionSettings;
}
