export interface NetworkAttributes {
  isActive: boolean;

  interfaces: Array<string>;

  selectedInterface: number;

  address: string;

  port: number;

  endpoint: string;
}
