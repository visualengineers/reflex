import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TuioComponent } from './tuio.component';
import { LogService } from 'src/app/log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TuioService } from 'src/shared/services/tuio.service';
import { DEFAULT_SETTINGS } from 'src/shared/trackingServerAppSettings.default';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { JsonSimpleValue } from 'src/shared/data-formats/json-simple-value';
import { MockPanelHeaderComponent } from 'src/app/elements/panel-header/panel-header.component.mock';
import { MockValueSelectionComponent } from 'src/app/elements/value-selection/value-selection.component.mock';
import { MockValueTextComponent } from 'src/app/elements/value-text/value-text.component.mock';
import { FormsModule } from '@angular/forms';
import { PackageDetailsComponent } from './package-details/package-details.component';
import { MockPackageDetailsComponent } from './package-details/package-details.component.mock';

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]);

  const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService', 
  [
    'getSettings',
    'update'
  ]);

const tuioService = jasmine.createSpyObj<TuioService>('fakeTuioService',
  [
    'getIsBroadcasting',
    'getTransportProtocols',
    'getTuioProtocolVersions',
    'getTuioInterpretations',
    'getStatus'
  ]);

const broadcastingState: JsonSimpleValue = { name: 'IsBroadcasting', value: true };
const transportProtocols = ['Test1', 'Test2', 'Test3'];
const tuioVersions = ['Tuio1', 'Tuio2', 'Tuio3', 'Tuio4'];
const interpretations = ['interpretation1', 'interpretation2'];

describe('TuioComponent', () => {
  let component: TuioComponent;
  let fixture: ComponentFixture<TuioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ 
        TuioComponent, 
        MockPackageDetailsComponent,
        MockPanelHeaderComponent, 
        MockValueSelectionComponent, 
        MockValueTextComponent
      ],
      imports: [ FormsModule ],
      providers: [
        {
          provide: SettingsService, useValue: settingsService
        },
        {
          provide: TuioService, useValue: tuioService
        },
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
    settingsService.update.and.returnValue();

    logService.sendErrorLog.and.returnValue();

    tuioService.getIsBroadcasting.and.returnValue(of(new HttpResponse({body: broadcastingState})));
    tuioService.getTransportProtocols.and.returnValue(of(transportProtocols));
    tuioService.getTuioProtocolVersions.and.returnValue(of(tuioVersions));
    tuioService.getTuioInterpretations.and.returnValue(of(interpretations));
    tuioService.getStatus.and.returnValue(of('TUIO is running (TEST)'));


    fixture = TestBed.createComponent(TuioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    settingsService.getSettings.calls.reset();
    settingsService.update.calls.reset();

    logService.sendErrorLog.calls.reset();

    tuioService.getIsBroadcasting.calls.reset();
    tuioService.getTransportProtocols.calls.reset();
    tuioService.getTuioProtocolVersions.calls.reset();
    tuioService.getTuioInterpretations.calls.reset();
    tuioService.getStatus.calls.reset();
  });

  it('should create', () => {


    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(settingsService.update).toHaveBeenCalledTimes(1);

    expect(tuioService.getIsBroadcasting).toHaveBeenCalledTimes(1);
    expect(tuioService.getTransportProtocols).toHaveBeenCalledTimes(1);
    expect(tuioService.getTuioProtocolVersions).toHaveBeenCalledTimes(1);
    expect(tuioService.getTuioInterpretations).toHaveBeenCalledTimes(1);
    expect(tuioService.getStatus).toHaveBeenCalledTimes(1);
  });
});
