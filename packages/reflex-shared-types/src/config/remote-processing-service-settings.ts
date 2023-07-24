import { RemoteProcessingAlgorithm } from './remote-processing-algorithm';

export interface RemoteProcessingServiceSettings {
  address: string;

  numSkipValues: number;

  completeDataSet: boolean;

  cutOff: number;

  factor: number;

  algorithm: RemoteProcessingAlgorithm;
}
