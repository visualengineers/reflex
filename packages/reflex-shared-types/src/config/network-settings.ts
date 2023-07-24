import { NetworkInterface } from './network-interface';

export interface NetworkSettings {

  networkInterfaceType: NetworkInterface;
  interval: number;
  address: string;
  port: number;
  endpoint: string;
}
