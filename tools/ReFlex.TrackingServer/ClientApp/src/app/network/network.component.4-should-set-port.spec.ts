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

  it('should set port', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const newPort1 = 4500;
    const newPort2 = 12345;

    const update1: JsonSimpleValue = { name: 'port', value: newPort1 };
    const update2: JsonSimpleValue = { name: 'port', value: newPort2 };

    const errorPort = 'TestError: networkService.setPort';

    mockReturnValueForArgs(networkService.setPort, [newPort1], of(new HttpResponse<JsonSimpleValue>({ body: update1 })));

    component.networkSettings.port = newPort1;

    component.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(1);

    expect(networkService.setPort).toHaveBeenCalledWith(newPort1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setPort.mockReturnValue(throwError(errorPort));

    component.networkSettings.port = newPort2;

    component.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(2);
    expect(networkService.setPort).toHaveBeenCalledWith(newPort2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPort);

    networkService.setPort.mockClear();
    logService.sendErrorLog.mockClear();

    component.networkSettings.port = newPort2;

    mockReturnValueForArgs(networkService.setPort, [newPort2], of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    component.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(1);

    expect(networkService.setPort).toHaveBeenCalledWith(newPort2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
