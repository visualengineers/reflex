import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TuioComponent } from './tuio.component';
import { LogService } from 'src/app/log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TuioService } from 'src/shared/services/tuio.service';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MockPackageDetailsComponent } from './package-details/package-details.component.mock';
import { DEFAULT_SETTINGS, JsonSimpleValue } from '@reflex/shared-types';
import { MockPanelHeaderComponent, MockValueSelectionComponent, MockValueTextComponent, PanelHeaderComponent, ValueSelectionComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { PackageDetailsComponent } from './package-details/package-details.component';

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
    'getStatus',
    'getPackages'
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
    imports: [FormsModule,
        TuioComponent
    ],
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
    }).overrideComponent(TuioComponent, {
      remove: { imports: [ PanelHeaderComponent, ValueSelectionComponent, ValueTextComponent, PackageDetailsComponent] },
      add: { imports: [ MockPanelHeaderComponent, MockValueSelectionComponent, MockValueTextComponent, MockPackageDetailsComponent ] }
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
