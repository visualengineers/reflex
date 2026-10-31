import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';

import { ProcessingComponent } from './processing.component';
import { FormsModule } from '@angular/forms';
import { SettingsService } from 'src/shared/services/settingsService';
import { LogService } from '../log/log.service';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { of } from 'rxjs';
import { InteractionsComponent } from './interactions/interactions.component';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import { MockHistoryVisualizationComponent } from './history-visualization/history-visualization.component.mock';
import { MockHistoryComponent } from './history/history.component.mock';
import {
  CompleteInteractionData,
  DEFAULT_SETTINGS,
  FrameSizeDefinition,
  RemoteProcessingAlgorithm,
  RemoteProcessingServiceSettings,
} from '@reflex/shared-types';
import {
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueSliderComponent,
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  MockValueSliderComponent,
} from '@reflex/angular-components/dist';
import { HistoryVisualizationComponent } from './history-visualization/history-visualization.component';
import { HistoryComponent } from './history/history.component';
import { MockInteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component.mock';
import { MockInteractionsComponent } from './interactions/interactions.component.mock';

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
};

const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  saveSettings: vi.fn().mockName('fakeSettingsService.saveSettings'),
};

const calibrationService = {
  computeCalibratedAbsolutePosition: vi
    .fn()
    .mockName('fakeCalibrationService.computeCalibratedAbsolutePosition'),
  getFrameSize: vi.fn().mockName('fakeCalibrationService.getFrameSize'),
};

const processingService = {
  getFrames: vi.fn().mockName('fakeProcessingService.getFrames'),
  getStatus: vi.fn().mockName('fakeProcessingService.getStatus'),
  getObserverTypes: vi.fn().mockName('fakeProcessingService.getObserverTypes'),
  getSelectedObserverType: vi
    .fn()
    .mockName('fakeProcessingService.getSelectedObserverType'),
  getHistory: vi.fn().mockName('fakeProcessingService.getHistory'),
  getInteractions: vi.fn().mockName('fakeProcessingService.getInteractions'),
  getInterval: vi.fn().mockName('fakeProcessingService.getInterval'),
  getRemoteProcessorSettings: vi
    .fn()
    .mockName('fakeProcessingService.getRemoteProcessorSettings'),
  setRemoteProcessorSettings: vi
    .fn()
    .mockName('fakeProcessingService.setRemoteProcessorSettings'),
};

const customFrame: FrameSizeDefinition = {
  width: 500,
  height: 400,
  left: 150,
  top: 75,
};

const interactionData: CompleteInteractionData = {
  raw: [],
  normalized: [],
  absolute: [],
};

const observerTypes = ['None', 'TestObserver', 'RealObserver'];

const remoteObserver: RemoteProcessingServiceSettings = {
  address: 'http://localhost:50051',
  numSkipValues: 0,
  completeDataSet: false,
  useGzipCompression: true,
  cutOff: 0,
  factor: 0,
  algorithm: RemoteProcessingAlgorithm.Default,
};

describe('ProcessingComponent', () => {
  let component: ProcessingComponent;
  let fixture: ComponentFixture<ProcessingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ProcessingComponent],
      providers: [
        {
          provide: CalibrationService,
          useValue: calibrationService,
        },
        {
          provide: ProcessingService,
          useValue: processingService,
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
      ],
    })
      .overrideComponent(ProcessingComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSelectionComponent,
            ValueSliderComponent,
            InteractionsComponent,
            InteractionsVisualizationComponent,
            HistoryVisualizationComponent,
            HistoryComponent,
          ],
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockValueSliderComponent,
            MockInteractionsComponent,
            MockInteractionsVisualizationComponent,
            MockHistoryVisualizationComponent,
            MockHistoryComponent,
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    calibrationService.computeCalibratedAbsolutePosition.mockReturnValue(
      of(interactionData)
    );
    calibrationService.getFrameSize.mockReturnValue(of(customFrame));

    processingService.getInteractions.mockReturnValue(of([]));
    processingService.getStatus.mockReturnValue(of('Active'));
    processingService.getObserverTypes.mockReturnValue(of(observerTypes));
    processingService.getSelectedObserverType.mockReturnValue(of(0));
    processingService.getInterval.mockReturnValue(of(100));
    processingService.getRemoteProcessorSettings.mockReturnValue(
      of({ ...remoteObserver })
    );
    processingService.setRemoteProcessorSettings.mockReturnValue(
      of(new HttpResponse({ body: { ...remoteObserver } }))
    );

    settingsService.getSettings.mockReturnValue(of({ ...DEFAULT_SETTINGS }));
    settingsService.saveSettings.mockReturnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.mockReturnValue(undefined);

    fixture = TestBed.createComponent(ProcessingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    calibrationService.computeCalibratedAbsolutePosition.mockClear();
    calibrationService.getFrameSize.mockClear();

    processingService.getInteractions.mockClear();
    processingService.getStatus.mockClear();
    processingService.getObserverTypes.mockClear();
    processingService.getSelectedObserverType.mockClear();
    processingService.getInterval.mockClear();
    processingService.getRemoteProcessorSettings.mockClear();
    processingService.setRemoteProcessorSettings.mockClear();

    settingsService.getSettings.mockClear();
    settingsService.saveSettings.mockClear();

    logService.sendErrorLog.mockClear();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(1);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
    // BUG ?
    expect(processingService.getStatus).toHaveBeenCalledTimes(2);

    expect(processingService.getObserverTypes).toHaveBeenCalledTimes(1);
    expect(processingService.getSelectedObserverType).toHaveBeenCalledTimes(1);
    expect(processingService.getInterval).toHaveBeenCalledTimes(1);
    expect(processingService.getRemoteProcessorSettings).toHaveBeenCalledTimes(
      1
    );

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);

    expect(settingsService.saveSettings).not.toHaveBeenCalled();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('loads, updates and saves gzip compression through the shared checkbox', async () => {
    processingService.getSelectedObserverType.mockReturnValue(of(3));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector(
      '#processing-remote-gzipCompression-checkbox'
    );
    expect(checkbox.checked).toBe(true);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.remoteSettings.useGzipCompression).toBe(false);
    expect(processingService.setRemoteProcessorSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        useGzipCompression: false,
        address: remoteObserver.address,
        factor: remoteObserver.factor,
      })
    );

    component.saveRemoteProcessingSettings();
    expect(settingsService.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteProcessingServiceSettingsValues: expect.objectContaining({
          useGzipCompression: false,
        }),
      })
    );

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      vi.mocked(processingService.setRemoteProcessorSettings).mock.lastCall![0]
        .useGzipCompression
    ).toBe(true);
  });
});
