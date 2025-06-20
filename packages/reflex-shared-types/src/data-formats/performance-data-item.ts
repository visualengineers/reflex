export interface PerformanceDataItem {
  frameId: number;
  frameStart: number;
  frameEnd: number;
  totalFrameTime: number;
  limitationFilter?: number;
  valueFilter?: number;
  thresholdFilter?: number;
  updatePointCloud?: number;
  boxFilter?: number;
  totalFilter?: number;
  processingPreparation?: number;
  processingUpdate?: number;
  processingConvert?: number;
  processingSmoothing?: number;
  processingExtremum?: number;
  totalProcessing?: number;
}
