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

  it('should set network interface', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const off: JsonSimpleValue = { name: 'interface', value: 'None' };
    const websocket: JsonSimpleValue = {
      name: 'interface',
      value: 'Websockets'
    };
    const tcp: JsonSimpleValue = { name: 'interface', value: 'Tcp' };

    const errorTcp = 'TestError: networkService.setNetworkInterface';

    mockReturnValueForArgs(networkService.setNetworkInterface, ['None'], of(new HttpResponse<JsonSimpleValue>({ body: off })));
    mockReturnValueForArgs(networkService.setNetworkInterface, ['Websockets'], of(new HttpResponse<JsonSimpleValue>({ body: websocket })));

    component.selectedInterfaceIdx = 0;

    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(1);

    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('None');
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.selectedInterfaceIdx = 1;

    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(2);
    expect(networkService.setNetworkInterface).toHaveBeenCalledWith(
      'Websockets'
    );
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.selectedInterfaceIdx = 2;

    networkService.setNetworkInterface.mockReturnValue(throwError(errorTcp));
    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(3);
    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('Tcp');
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTcp);

    networkService.setNetworkInterface.mockClear();
    logService.sendErrorLog.mockClear();

    mockReturnValueForArgs(networkService.setNetworkInterface, ['Tcp'], of(new HttpResponse<JsonSimpleValue>({ body: tcp })));

    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(1);

    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('Tcp');
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
