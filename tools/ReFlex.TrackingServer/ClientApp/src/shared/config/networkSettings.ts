import { NetworkInterface } from './networkInterface';

export interface NetworkSettings {

  networkInterfaceType: NetworkInterface;
  interval: number;
  address: string;
  port: number;
  endpoint: string;
}
