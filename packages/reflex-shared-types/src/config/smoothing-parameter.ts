import { FilterType } from './filter-type';

export interface SmoothingParameter {
  interactionHistorySize: number;
  numSmoothingSamples: number;
  /** Inclusive maximum age of the last measurement in seconds; independent of history capacity. */
  contactRetentionSeconds: number;
  touchMergeDistance2D: number;
  depthScale: number;
  type: FilterType;
}
