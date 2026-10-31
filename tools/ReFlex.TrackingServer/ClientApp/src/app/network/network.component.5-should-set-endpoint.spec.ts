import {
  HttpResponse
} from '@angular/common/http';
import {
  JsonSimpleValue
} from '@reflex/shared-types';
import { of, throwError } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { component, fixture, setupTests } from './network.component.test-context';
import { logService, networkService } from './network.component.test-data';

describe('NetworkComponent', () => {
  setupTests();

  it('should set endpoint', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const newEndpoint1 = 'reflex/test';
    const newEndpoint2 = 'another/test/endpoint';

    const update1: JsonSimpleValue = { name: 'endPoint', value: newEndpoint1 };
    const update2: JsonSimpleValue = { name: 'endPoint', value: newEndpoint2 };

    const errorEndpoint = 'TestError: networkService.setEndpoint';

    mockReturnValueForArgs(networkService.setEndpoint, [newEndpoint1], of(new HttpResponse<JsonSimpleValue>({ body: update1 })));

    component.networkSettings.endpoint = newEndpoint1;

    component.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(1);

    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setEndpoint.mockReturnValue(throwError(errorEndpoint));

    component.networkSettings.endpoint = newEndpoint2;

    component.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(2);
    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorEndpoint);

    networkService.setEndpoint.mockClear();
    logService.sendErrorLog.mockClear();

    component.networkSettings.endpoint = newEndpoint2;

    mockReturnValueForArgs(networkService.setEndpoint, [newEndpoint2], of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    component.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(1);

    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should save settings', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const errorSave = 'TestError: networkService.saveSettings';

    component.saveNetworkSettings();

    expect(networkService.saveSettings).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.saveSettings.mockReturnValue(throwError(errorSave));

    component.saveNetworkSettings();

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
