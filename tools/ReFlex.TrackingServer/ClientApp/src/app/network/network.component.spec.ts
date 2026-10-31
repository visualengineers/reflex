import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkComponent } from './network.component';
import { LogService } from '../log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { NetworkingService } from 'src/shared/services/networking.service';
import { FormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MockTuioComponent } from './tuio/tuio.component.mock';
import {
  HttpResponse,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {
  DEFAULT_SETTINGS,
  JsonSimpleValue,
  NetworkAttributes,
} from '@reflex/shared-types';
import {
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueTextComponent,
  ValueSliderComponent,
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  MockValueSliderComponent,
  MockValueTextComponent,
} from '@reflex/angular-components/dist';
import { TuioComponent } from './tuio/tuio.component';

const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  saveSettings: vi.fn().mockName('fakeSettingsService.saveSettings'),
  update: vi.fn().mockName('fakeSettingsService.update'),
};

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
};

const networkService = {
  getStatus: vi.fn().mockName('fakeNetworkService.getStatus'),
  getStatusValues: vi.fn().mockName('fakeNetworkService.getStatusValues'),
  toggleBroadcasting: vi.fn().mockName('fakeNetworkService.toggleBroadcasting'),
  setNetworkInterface: vi
    .fn()
    .mockName('fakeNetworkService.setNetworkInterface'),
  setAddress: vi.fn().mockName('fakeNetworkService.setAddress'),
  setPort: vi.fn().mockName('fakeNetworkService.setPort'),
  setEndpoint: vi.fn().mockName('fakeNetworkService.setEndpoint'),
  saveSettings: vi.fn().mockName('fakeNetworkService.saveSettings'),
};

const networkSettings: NetworkAttributes = {
  isActive: true,
  interfaces: ['None', 'Websockets', 'Tcp'],
  selectedInterface: 2,
  address: '101.123.0.1',
  port: 12345,
  endpoint: 'TestEndpoint',
};

describe('NetworkComponent', () => {
  let component: NetworkComponent;
  let fixture: ComponentFixture<NetworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, NetworkComponent],
      providers: [
        {
          provide: NetworkingService,
          useValue: networkService,
        },
        {
          provide: SettingsService,
          useValue: settingsService,
        },
        {
          provide: LogService,
          useValue: logService,
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost',
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(NetworkComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSelectionComponent,
            ValueTextComponent,
            ValueSliderComponent,
            TuioComponent,
          ],
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockValueTextComponent,
            MockValueSliderComponent,
            MockTuioComponent,
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkComponent);
    component = fixture.componentInstance;

    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));
    settingsService.saveSettings.mockReturnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.mockReturnValue(undefined);

    networkService.getStatusValues.mockReturnValue(of(networkSettings));
    networkService.getStatus.mockReturnValue(of('Connected to Testservice...'));

    networkService.saveSettings.mockReturnValue(
      of(
        new HttpResponse<JsonSimpleValue>({
          body: {
            name: 'save result',
            value: 'save succesful !',
          },
        })
      )
    );
  });

  afterEach(() => {
    settingsService.getSettings.mockClear();
    settingsService.saveSettings.mockClear();

    logService.sendErrorLog.mockClear();

    networkService.getStatusValues.mockClear();
    networkService.getStatus.mockClear();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should initialize correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).toHaveBeenCalledTimes(1);
    expect(networkService.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.networkInterfaces).toEqual(networkSettings.interfaces);
    expect(component.networkSettings).toBeDefined;
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

    const ErrorToggle = 'TestError: networkService.toggleBroadcasting';
    networkService.toggleBroadcasting.mockReturnValue(throwError(ErrorToggle));

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(4);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(
      `${ErrorToggle} - ${JSON.stringify(ErrorToggle, null, 3)}`
    );
    expect(component.isBroadcasting).toBe(false);
  });

  it('should set network interface', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const off: JsonSimpleValue = { name: 'interface', value: 'None' };
    const websocket: JsonSimpleValue = {
      name: 'interface',
      value: 'Websockets',
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

  it('should handle errors correctly: Settings cannot be retrieved', async () => {
    const errorSettings = 'TesError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();

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

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).toHaveBeenCalledTimes(1);
    expect(networkService.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorValues);
  });
});
