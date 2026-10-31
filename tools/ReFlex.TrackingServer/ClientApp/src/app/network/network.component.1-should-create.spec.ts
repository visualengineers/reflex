import {
  HttpResponse
} from '@angular/common/http';
import {
  JsonSimpleValue
} from '@reflex/shared-types';
import { of, throwError } from 'rxjs';
import { component, fixture, setupTests } from './network.component.test-context';
import { logService, networkService, networkSettings, settingsService } from './network.component.test-data';

describe('NetworkComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should initialize correctly', async () => {
    fixture.detectChanges();
    await await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).toHaveBeenCalledTimes(1);
    expect(networkService.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.networkInterfaces).toEqual(networkSettings.interfaces);
    expect(component.networkSettings).toBeDefined();
    expect(component.networkSettings.address).toEqual(networkSettings.address);
    expect(component.networkSettings.port).toEqual(networkSettings.port);
    expect(component.networkSettings.endpoint).toEqual(
      networkSettings.endpoint
    );
    expect(component.isBroadcasting).toEqual(networkSettings.isActive);

    expect(component.selectedInterfaceIdx).toEqual(
      networkSettings.selectedInterface
    );
    expect(component.networkSettings.networkInterfaceType).toEqual(
      networkSettings.selectedInterface
    );
  });

  it('should toggle broadcasting state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isBroadcasting).toBe(true);

    const on: JsonSimpleValue = { name: 'isActive', value: true };
    const off: JsonSimpleValue = { name: 'isActive', value: false };
    networkService.toggleBroadcasting.mockReturnValue(
      of(new HttpResponse<JsonSimpleValue>({ body: off }))
    );

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(1);
    expect(component.isBroadcasting).toBe(false);

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(2);
    expect(component.isBroadcasting).toBe(false);

    networkService.toggleBroadcasting.mockReturnValue(
      of(new HttpResponse<JsonSimpleValue>({ body: on }))
    );

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(3);
    expect(component.isBroadcasting).toBe(true);

    const errorToggle = 'TestError: networkService.toggleBroadcasting';
    networkService.toggleBroadcasting.mockReturnValue(throwError(errorToggle));

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(4);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(
      `${errorToggle} - ${JSON.stringify(errorToggle, null, 3)}`
    );
    expect(component.isBroadcasting).toBe(false);
  });
});
