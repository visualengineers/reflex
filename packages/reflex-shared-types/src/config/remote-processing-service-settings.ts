import { RemoteProcessingAlgorithm } from './remote-processing-algorithm';

export interface RemoteProcessingServiceSettings {
  address: string;

  numSkipValues: number;

  completeDataSet: boolean;

  useGzipCompression: boolean;

  cutOff: number;

  factor: number;

  algorithm: RemoteProcessingAlgorithm;
}
