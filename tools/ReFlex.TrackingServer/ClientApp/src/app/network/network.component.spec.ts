import { HttpResponse } from '@angular/common/http';
import { DEFAULT_SETTINGS, JsonSimpleValue } from '@reflex/shared-types';
import { Subject, of, throwError } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import {
  mount,
  network,
  settings,
  setupTests as setupZonelessTests,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { NetworkComponent } from './network.component';
import { component as testComponent, fixture as testFixture, setupTests } from './network.component.test-context';
import { logService, networkService, networkSettings, settingsService } from './network.component.test-data';

describe('Zoneless change detection: renders network SignalR updates', () => {
  setupZonelessTests();

  it('renders network SignalR updates', async () => {
    settings.getSettings.mockReturnValue(of(structuredClone(DEFAULT_SETTINGS)));
    const response = new Subject<string>();
    network.getStatus.mockReturnValue(response);
    const fixture = await mount(NetworkComponent);
    response.next('Async network status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async network status');
  });
});

describe('NetworkComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should initialize correctly', async () => {
    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(testComponent).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).toHaveBeenCalledTimes(1);
    expect(networkService.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(testComponent.networkInterfaces).toEqual(networkSettings.interfaces);
    expect(testComponent.networkSettings).toBeDefined();
    expect(testComponent.networkSettings.address).toEqual(networkSettings.address);
    expect(testComponent.networkSettings.port).toEqual(networkSettings.port);
    expect(testComponent.networkSettings.endpoint).toEqual(
      networkSettings.endpoint
    );
    expect(testComponent.isBroadcasting).toEqual(networkSettings.isActive);

    expect(testComponent.selectedInterfaceIdx).toEqual(
      networkSettings.selectedInterface
    );
    expect(testComponent.networkSettings.networkInterfaceType).toEqual(
      networkSettings.selectedInterface
    );
  });

  it('should toggle broadcasting state', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(testComponent.isBroadcasting).toBe(true);

    const on: JsonSimpleValue = { name: 'isActive', value: true };
    const off: JsonSimpleValue = { name: 'isActive', value: false };
    networkService.toggleBroadcasting.mockReturnValue(
      of(new HttpResponse<JsonSimpleValue>({ body: off }))
    );

    testComponent.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(1);
    expect(testComponent.isBroadcasting).toBe(false);

    testComponent.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(2);
    expect(testComponent.isBroadcasting).toBe(false);

    networkService.toggleBroadcasting.mockReturnValue(
      of(new HttpResponse<JsonSimpleValue>({ body: on }))
    );

    testComponent.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(3);
    expect(testComponent.isBroadcasting).toBe(true);

    const errorToggle = 'TestError: networkService.toggleBroadcasting';
    networkService.toggleBroadcasting.mockReturnValue(throwError(errorToggle));

    testComponent.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(4);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(
      `${errorToggle} - ${JSON.stringify(errorToggle, null, 3)}`
    );
    expect(testComponent.isBroadcasting).toBe(false);
  });
});

describe('NetworkComponent', () => {
  setupTests();

  it('should set network interface', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    const off: JsonSimpleValue = { name: 'interface', value: 'None' };
    const websocket: JsonSimpleValue = {
      name: 'interface',
      value: 'Websockets'
    };
    const tcp: JsonSimpleValue = { name: 'interface', value: 'Tcp' };

    const errorTcp = 'TestError: networkService.setNetworkInterface';

    mockReturnValueForArgs(networkService.setNetworkInterface, ['None'], of(new HttpResponse<JsonSimpleValue>({ body: off })));
    mockReturnValueForArgs(networkService.setNetworkInterface, ['Websockets'], of(new HttpResponse<JsonSimpleValue>({ body: websocket })));

    testComponent.selectedInterfaceIdx = 0;

    testComponent.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(1);

    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('None');
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    testComponent.selectedInterfaceIdx = 1;

    testComponent.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(2);
    expect(networkService.setNetworkInterface).toHaveBeenCalledWith(
      'Websockets'
    );
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    testComponent.selectedInterfaceIdx = 2;

    networkService.setNetworkInterface.mockReturnValue(throwError(errorTcp));
    testComponent.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(3);
    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('Tcp');
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTcp);

    networkService.setNetworkInterface.mockClear();
    logService.sendErrorLog.mockClear();

    mockReturnValueForArgs(networkService.setNetworkInterface, ['Tcp'], of(new HttpResponse<JsonSimpleValue>({ body: tcp })));

    testComponent.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(1);

    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('Tcp');
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('NetworkComponent', () => {
  setupTests();

  it('should set address', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    const newAddress1 = '123.456.789.0';
    const newAddress2 = 'localhost';

    const update1: JsonSimpleValue = { name: 'address', value: newAddress1 };
    const update2: JsonSimpleValue = { name: 'address', value: newAddress2 };

    const errorAddress = 'TestError: networkService.setAddress';

    mockReturnValueForArgs(networkService.setAddress, [newAddress1], of(new HttpResponse<JsonSimpleValue>({ body: update1 })));

    testComponent.networkSettings.address = newAddress1;

    testComponent.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(1);

    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setAddress.mockReturnValue(throwError(errorAddress));

    testComponent.networkSettings.address = newAddress2;

    testComponent.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(2);
    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorAddress);

    networkService.setAddress.mockClear();
    logService.sendErrorLog.mockClear();

    testComponent.networkSettings.address = newAddress2;

    mockReturnValueForArgs(networkService.setAddress, [newAddress2], of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    testComponent.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(1);

    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('NetworkComponent', () => {
  setupTests();

  it('should set port', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    const newPort1 = 4500;
    const newPort2 = 12345;

    const update1: JsonSimpleValue = { name: 'port', value: newPort1 };
    const update2: JsonSimpleValue = { name: 'port', value: newPort2 };

    const errorPort = 'TestError: networkService.setPort';

    mockReturnValueForArgs(networkService.setPort, [newPort1], of(new HttpResponse<JsonSimpleValue>({ body: update1 })));

    testComponent.networkSettings.port = newPort1;

    testComponent.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(1);

    expect(networkService.setPort).toHaveBeenCalledWith(newPort1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setPort.mockReturnValue(throwError(errorPort));

    testComponent.networkSettings.port = newPort2;

    testComponent.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(2);
    expect(networkService.setPort).toHaveBeenCalledWith(newPort2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPort);

    networkService.setPort.mockClear();
    logService.sendErrorLog.mockClear();

    testComponent.networkSettings.port = newPort2;

    mockReturnValueForArgs(networkService.setPort, [newPort2], of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    testComponent.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(1);

    expect(networkService.setPort).toHaveBeenCalledWith(newPort2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('NetworkComponent', () => {
  setupTests();

  it('should set endpoint', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    const newEndpoint1 = 'reflex/test';
    const newEndpoint2 = 'another/test/endpoint';

    const update1: JsonSimpleValue = { name: 'endPoint', value: newEndpoint1 };
    const update2: JsonSimpleValue = { name: 'endPoint', value: newEndpoint2 };

    const errorEndpoint = 'TestError: networkService.setEndpoint';

    mockReturnValueForArgs(networkService.setEndpoint, [newEndpoint1], of(new HttpResponse<JsonSimpleValue>({ body: update1 })));

    testComponent.networkSettings.endpoint = newEndpoint1;

    testComponent.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(1);

    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setEndpoint.mockReturnValue(throwError(errorEndpoint));

    testComponent.networkSettings.endpoint = newEndpoint2;

    testComponent.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(2);
    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorEndpoint);

    networkService.setEndpoint.mockClear();
    logService.sendErrorLog.mockClear();

    testComponent.networkSettings.endpoint = newEndpoint2;

    mockReturnValueForArgs(networkService.setEndpoint, [newEndpoint2], of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    testComponent.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(1);

    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should save settings', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    const errorSave = 'TestError: networkService.saveSettings';

    testComponent.saveNetworkSettings();

    expect(networkService.saveSettings).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.saveSettings.mockReturnValue(throwError(errorSave));

    testComponent.saveNetworkSettings();

    expect(networkService.saveSettings).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(
      `Cannot save settings: ${errorSave} - ${JSON.stringify(
        errorSave,
        null,
        3
      )}`
    );

    networkService.saveSettings.mockClear();
  });
});

describe('NetworkComponent', () => {
  setupTests();

  it('should handle errors correctly: Settings cannot be retrieved', async () => {
    const errorSettings = 'TesError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(testComponent).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).not.toHaveBeenCalled();
    expect(networkService.getStatus).not.toHaveBeenCalled();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
  });

  it('should handle errors correctly: Networking service not available', async () => {
    const errorValues = 'TesError: networkService.getStatusValues';
    networkService.getStatusValues.mockReturnValue(throwError(errorValues));

    const errorStatus = 'TesError: networkService.getStatus';
    networkService.getStatus.mockReturnValue(throwError(errorStatus));

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(testComponent).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).toHaveBeenCalledTimes(1);
    expect(networkService.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorValues);
  });
});
