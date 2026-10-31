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

  it('should set address', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const newAddress1 = '123.456.789.0';
    const newAddress2 = 'localhost';

    const update1: JsonSimpleValue = { name: 'address', value: newAddress1 };
    const update2: JsonSimpleValue = { name: 'address', value: newAddress2 };

    const errorAddress = 'TestError: networkService.setAddress';

    mockReturnValueForArgs(networkService.setAddress, [newAddress1], of(new HttpResponse<JsonSimpleValue>({ body: update1 })));

    component.networkSettings.address = newAddress1;

    component.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(1);

    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setAddress.mockReturnValue(throwError(errorAddress));

    component.networkSettings.address = newAddress2;

    component.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(2);
    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorAddress);

    networkService.setAddress.mockClear();
    logService.sendErrorLog.mockClear();

    component.networkSettings.address = newAddress2;

    mockReturnValueForArgs(networkService.setAddress, [newAddress2], of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    component.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(1);

    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
