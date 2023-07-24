import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NetworkComponent } from './network.component';
import { LogService } from '../log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { NetworkingService } from 'src/shared/services/networking.service';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MockPanelHeaderComponent } from '../elements/panel-header/panel-header.component.mock';
import { MockValueSelectionComponent } from '../elements/value-selection/value-selection.component.mock';
import { MockValueTextComponent } from '../elements/value-text/value-text.component.mock';
import { MockValueSliderComponent } from '../elements/value-slider/value-slider.mock';
import { MockTuioComponent } from './tuio/tuio.component.mock';
import { HttpResponse } from '@angular/common/http';
import { DEFAULT_SETTINGS, JsonSimpleValue, NetworkAttributes } from '@reflex/shared-types';

const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService', 
  [
    'getSettings',
    'saveSettings'
  ]);

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]);

const networkService = jasmine.createSpyObj<NetworkingService>('fakeNetworkService', 
  [
    'getStatus',
    'getStatusValues',
    'toggleBroadcasting',
    'setNetworkInterface',
    'setAddress',
    'setPort',
    'setEndpoint',
    'saveSettings'
  ]);  

const networkSettings: NetworkAttributes = {
  isActive: true,
  interfaces: ['None', 'Websockets', 'Tcp'],
  selectedInterface: 2,
  address: '101.123.0.1',
  port: 12345,
  endpoint: 'TestEndpoint'
};

describe('NetworkComponent', () => {
  let component: NetworkComponent;
  let fixture: ComponentFixture<NetworkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        NetworkComponent,
        MockPanelHeaderComponent,
        MockValueSelectionComponent,
        MockValueTextComponent,
        MockValueSliderComponent,
        MockTuioComponent
       ],
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: NetworkingService, useValue: networkService
        },
        {
          provide: SettingsService, useValue: settingsService
        },
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkComponent);
    component = fixture.componentInstance;

    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
    settingsService.saveSettings.and.returnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.and.returnValue();   

    networkService.getStatusValues.and.returnValue(of(networkSettings));
    networkService.getStatus.and.returnValue(of('Connected to Testservice...'));

    networkService.saveSettings.and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: {
      name: 'save result',
      value: 'save succesful !'
    }})));
  });

  afterEach(() => {
    settingsService.getSettings.calls.reset();
    settingsService.saveSettings.calls.reset();

    logService.sendErrorLog.calls.reset(); 

    networkService.getStatusValues.calls.reset();
    networkService.getStatus.calls.reset();
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
    expect(component.networkSettings.endpoint).toEqual(networkSettings.endpoint);
    expect(component.isBroadcasting).toEqual(networkSettings.isActive);

    expect(component.selectedInterfaceIdx).toEqual(networkSettings.selectedInterface);
    expect(component.networkSettings.networkInterfaceType).toEqual(networkSettings.selectedInterface);
  });

  it('should toggle broadcasting state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isBroadcasting).toBeTrue();

    const on: JsonSimpleValue = { name: 'isActive', value: true };
    const off: JsonSimpleValue = { name: 'isActive', value: false };
    networkService.toggleBroadcasting.and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: off })));

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(1);
    expect(component.isBroadcasting).toBe(false);

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(2);
    expect(component.isBroadcasting).toBe(false);

    networkService.toggleBroadcasting.and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: on })));

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(3);
    expect(component.isBroadcasting).toBe(true);

    const ErrorToggle = 'TestError: networkService.toggleBroadcasting';
    networkService.toggleBroadcasting.and.returnValue(throwError(ErrorToggle));

    component.isBroadcastingChanged();

    expect(networkService.toggleBroadcasting).toHaveBeenCalledTimes(4);
    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(`${ErrorToggle} - ${JSON.stringify(ErrorToggle, null, 3)}`);
    expect(component.isBroadcasting).toBe(false);
  });

  it('should set network interface', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const off: JsonSimpleValue = { name: 'interface', value: 'None' };
    const websocket: JsonSimpleValue = { name: 'interface', value: 'Websockets' };
    const tcp: JsonSimpleValue = { name: 'interface', value: 'Tcp' };

    const errorTcp = 'TestError: networkService.setNetworkInterface';
    
    networkService.setNetworkInterface.withArgs('None').and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: off })));
    networkService.setNetworkInterface.withArgs('Websockets').and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: websocket })));
    
    component.selectedInterfaceIdx = 0;
    
    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledOnceWith('None');
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.selectedInterfaceIdx = 1;

    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(2);
    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('Websockets');
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.selectedInterfaceIdx = 2;

    networkService.setNetworkInterface.and.returnValue(throwError(errorTcp));
    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledTimes(3);
    expect(networkService.setNetworkInterface).toHaveBeenCalledWith('Tcp');
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTcp);

    networkService.setNetworkInterface.calls.reset();
    logService.sendErrorLog.calls.reset();

    networkService.setNetworkInterface.withArgs('Tcp').and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: tcp })));

    component.setNetworkInterface();

    expect(networkService.setNetworkInterface).toHaveBeenCalledOnceWith('Tcp');
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
    
    networkService.setAddress.withArgs(newAddress1).and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: update1 })));
            
    component.networkSettings.address = newAddress1;
    
    component.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledOnceWith(newAddress1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setAddress.and.returnValue(throwError(errorAddress));

    component.networkSettings.address = newAddress2;

    component.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledTimes(2);
    expect(networkService.setAddress).toHaveBeenCalledWith(newAddress2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorAddress);

    networkService.setAddress.calls.reset();
    logService.sendErrorLog.calls.reset();

    component.networkSettings.address = newAddress2;

    networkService.setAddress.withArgs(newAddress2).and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    component.setAddress();

    expect(networkService.setAddress).toHaveBeenCalledOnceWith(newAddress2);
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
    
    networkService.setPort.withArgs(newPort1).and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: update1 })));
            
    component.networkSettings.port = newPort1;
    
    component.setPort();

    expect(networkService.setPort).toHaveBeenCalledOnceWith(newPort1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setPort.and.returnValue(throwError(errorPort));

    component.networkSettings.port = newPort2;

    component.setPort();

    expect(networkService.setPort).toHaveBeenCalledTimes(2);
    expect(networkService.setPort).toHaveBeenCalledWith(newPort2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPort);

    networkService.setPort.calls.reset();
    logService.sendErrorLog.calls.reset();

    component.networkSettings.port = newPort2;

    networkService.setPort.withArgs(newPort2).and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    component.setPort();

    expect(networkService.setPort).toHaveBeenCalledOnceWith(newPort2);
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
    
    networkService.setEndpoint.withArgs(newEndpoint1).and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: update1 })));
            
    component.networkSettings.endpoint = newEndpoint1;
    
    component.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledOnceWith(newEndpoint1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.setEndpoint.and.returnValue(throwError(errorEndpoint));

    component.networkSettings.endpoint = newEndpoint2;

    component.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledTimes(2);
    expect(networkService.setEndpoint).toHaveBeenCalledWith(newEndpoint2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorEndpoint);

    networkService.setEndpoint.calls.reset();
    logService.sendErrorLog.calls.reset();

    component.networkSettings.endpoint = newEndpoint2;

    networkService.setEndpoint.withArgs(newEndpoint2).and.returnValue(of(new HttpResponse<JsonSimpleValue>({ body: update2 })));

    component.setEndpoint();

    expect(networkService.setEndpoint).toHaveBeenCalledOnceWith(newEndpoint2);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should save settings', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const errorSave = 'TestError: networkService.saveSettings';
                    
    component.saveNetworkSettings();

    expect(networkService.saveSettings).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    networkService.saveSettings.and.returnValue(throwError(errorSave));

    component.saveNetworkSettings();

    expect(networkService.saveSettings).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(`Cannot save settings: ${errorSave} - ${JSON.stringify(errorSave, null, 3)}`);

    networkService.saveSettings.calls.reset();

    
  });

  it('should handle errors correctly: Settings cannot be retrieved', async () => {   
    const errorSettings = 'TesError: settingsService.getSettings';
    settingsService.getSettings.and.returnValue(throwError(errorSettings));

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
    networkService.getStatusValues.and.returnValue(throwError(errorValues));

    const errorStatus = 'TesError: networkService.getStatus';
    networkService.getStatus.and.returnValue(throwError(errorStatus));

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
