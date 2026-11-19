import { FilterType } from './filter-type';

export interface SmoothingParameter {
  interactionHistorySize: number;
  numSmoothingSamples: number;
  /** Retention after a completed observation no longer detects the contact. */
  contactRetentionSeconds: number;
  /** Sensor/processing timeout in seconds; absent legacy values use 1. */
  observationTimeoutSeconds?: number;
  confidenceGainPerSecond: number;
  confidenceDecayPerSecond: number;
  touchMergeDistance2D: number;
  depthScale: number;
  type: FilterType;
}
