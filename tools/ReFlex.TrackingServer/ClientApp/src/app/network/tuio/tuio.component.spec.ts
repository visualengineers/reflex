import { HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  MockValueTextComponent,
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { DEFAULT_SETTINGS, JsonSimpleValue } from '@reflex/shared-types';
import { of, Subject } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TuioService } from 'src/shared/services/tuio.service';
import {
  mount,
  setupTests as setupZonelessTests,
  text,
  tuio
} from '../../test-utils/zoneless-change-detection.test-context';
import { PackageDetailsComponent } from './package-details/package-details.component';
import { MockPackageDetailsComponent } from './package-details/package-details.component.mock';
import { TuioComponent } from './tuio.component';

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  update: vi.fn().mockName('fakeSettingsService.update')
};

const tuioService = {
  getIsBroadcasting: vi.fn().mockName('fakeTuioService.getIsBroadcasting'),
  getTransportProtocols: vi
    .fn()
    .mockName('fakeTuioService.getTransportProtocols'),
  getTuioProtocolVersions: vi
    .fn()
    .mockName('fakeTuioService.getTuioProtocolVersions'),
  getTuioInterpretations: vi
    .fn()
    .mockName('fakeTuioService.getTuioInterpretations'),
  getStatus: vi.fn().mockName('fakeTuioService.getStatus'),
  getPackages: vi.fn().mockName('fakeTuioService.getPackages')
};

const broadcastingState: JsonSimpleValue = {
  name: 'IsBroadcasting',
  value: true
};
const transportProtocols = ['Test1', 'Test2', 'Test3'];
const tuioVersions = ['Tuio1', 'Tuio2', 'Tuio3', 'Tuio4'];
const interpretations = ['interpretation1', 'interpretation2'];

describe('TuioComponent', () => {
  let component: TuioComponent;
  let fixture: ComponentFixture<TuioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, TuioComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: settingsService
        },
        {
          provide: TuioService,
          useValue: tuioService
        },
        {
          provide: LogService,
          useValue: logService
        }
      ]
    })
      .overrideComponent(TuioComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSelectionComponent,
            ValueTextComponent,
            PackageDetailsComponent
          ]
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockValueTextComponent,
            MockPackageDetailsComponent
          ]
        }
      })
      .compileComponents();
  });

  beforeEach(() => {
    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));
    settingsService.update.mockReturnValue(undefined);

    logService.sendErrorLog.mockReturnValue(undefined);

    tuioService.getIsBroadcasting.mockReturnValue(
      of(new HttpResponse({ body: broadcastingState }))
    );
    tuioService.getTransportProtocols.mockReturnValue(of(transportProtocols));
    tuioService.getTuioProtocolVersions.mockReturnValue(of(tuioVersions));
    tuioService.getTuioInterpretations.mockReturnValue(of(interpretations));
    tuioService.getStatus.mockReturnValue(of('TUIO is running (TEST)'));

    fixture = TestBed.createComponent(TuioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    settingsService.getSettings.mockClear();
    settingsService.update.mockClear();

    logService.sendErrorLog.mockClear();

    tuioService.getIsBroadcasting.mockClear();
    tuioService.getTransportProtocols.mockClear();
    tuioService.getTuioProtocolVersions.mockClear();
    tuioService.getTuioInterpretations.mockClear();
    tuioService.getStatus.mockClear();
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

describe('Zoneless change detection: renders TUIO SignalR updates', () => {
  setupZonelessTests();

  it('renders TUIO SignalR updates', async () => {
    const response = new Subject<string>();
    tuio.getStatus.mockReturnValue(response);
    const fixture = await mount(TuioComponent);
    response.next('Async TUIO status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async TUIO status');
  });
});
