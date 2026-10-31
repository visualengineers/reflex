import {
  NetworkAttributes
} from '@reflex/shared-types';

export const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  saveSettings: vi.fn().mockName('fakeSettingsService.saveSettings'),
  update: vi.fn().mockName('fakeSettingsService.update')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const networkService = {
  getStatus: vi.fn().mockName('fakeNetworkService.getStatus'),
  getStatusValues: vi.fn().mockName('fakeNetworkService.getStatusValues'),
  toggleBroadcasting: vi.fn().mockName('fakeNetworkService.toggleBroadcasting'),
  setNetworkInterface: vi
    .fn()
    .mockName('fakeNetworkService.setNetworkInterface'),
  setAddress: vi.fn().mockName('fakeNetworkService.setAddress'),
  setPort: vi.fn().mockName('fakeNetworkService.setPort'),
  setEndpoint: vi.fn().mockName('fakeNetworkService.setEndpoint'),
  saveSettings: vi.fn().mockName('fakeNetworkService.saveSettings')
};

export const networkSettings: NetworkAttributes = {
  isActive: true,
  interfaces: ['None', 'Websockets', 'Tcp'],
  selectedInterface: 2,
  address: '101.123.0.1',
  port: 12345,
  endpoint: 'TestEndpoint'
};
