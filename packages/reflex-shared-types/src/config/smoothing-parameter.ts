import { FilterType } from './filter-type';

export interface SmoothingParameter {
  interactionHistorySize: number;
  numSmoothingSamples: number;
  maxNumEmptyFramesBetween: number;
  touchMergeDistance2D: number;
  depthScale: number;
  type: FilterType;
}
