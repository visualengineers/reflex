import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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
import { CompleteInteractionData, DEFAULT_SETTINGS, FrameSizeDefinition, RemoteProcessingAlgorithm, RemoteProcessingServiceSettings } from '@reflex/shared-types';
import { PanelHeaderComponent, ValueSelectionComponent, ValueSliderComponent, MockPanelHeaderComponent, MockValueSelectionComponent, MockValueSliderComponent } from '@reflex/angular-components/dist';
import { HistoryVisualizationComponent } from './history-visualization/history-visualization.component';
import { HistoryComponent } from './history/history.component';
import { MockInteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component.mock';
import { MockInteractionsComponent } from './interactions/interactions.component.mock';

const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]);

const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService',
  [
    'getSettings',
    'saveSettings'
  ]);

const calibrationService = jasmine.createSpyObj<CalibrationService>('fakeCalibrationService',
  [
     'computeCalibratedAbsolutePosition',
     'getFrameSize'
  ]
);

const processingService = jasmine.createSpyObj<ProcessingService>('fakeProcessingService',
  [
    'getFrames',
    'getStatus',
    'getObserverTypes',
    'getSelectedObserverType',
    'getHistory',
    'getInteractions',
    'getInterval',
    'getRemoteProcessorSettings',
    'setRemoteProcessorSettings'

  ]
);

const customFrame: FrameSizeDefinition =
  { width: 500, height: 400, left: 150, top: 75 };

const interactionData : CompleteInteractionData = {
  raw: [],
  normalized: [],
  absolute: []
}

const observerTypes = ['None', 'TestObserver', 'RealObserver'];

const remoteObserver : RemoteProcessingServiceSettings = {
  address: 'http://localhost:50051',
  numSkipValues: 0,
  completeDataSet: false,
  useGzipCompression: true,
  cutOff: 0,
  factor: 0,
  algorithm: RemoteProcessingAlgorithm.Default
}

describe('ProcessingComponent', () => {
  let component: ProcessingComponent;
  let fixture: ComponentFixture<ProcessingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FormsModule,
        ProcessingComponent
    ],
    providers: [
        {
            provide: CalibrationService, useValue: calibrationService
        },
        {
            provide: ProcessingService, useValue: processingService
        },
        {
            provide: SettingsService, useValue: settingsService
        },
        {
            provide: LogService, useValue: logService
        },
        {
            provide: BASE_URL, useValue: 'http://localhost'
        }
    ]
    }).overrideComponent(ProcessingComponent, {
      remove: { imports: [
        PanelHeaderComponent,
        ValueSelectionComponent,
        ValueSliderComponent,
        InteractionsComponent,
        InteractionsVisualizationComponent,
        HistoryVisualizationComponent,
        HistoryComponent
      ] },
      add: { imports: [
        MockPanelHeaderComponent,
        MockValueSelectionComponent,
        MockValueSliderComponent,
        MockInteractionsComponent,
        MockInteractionsVisualizationComponent,
        MockHistoryVisualizationComponent,
        MockHistoryComponent
       ] }
    })
    .compileComponents();
  }));

  beforeEach(() => {
    calibrationService.computeCalibratedAbsolutePosition.and.returnValue(of(interactionData));
    calibrationService.getFrameSize.and.returnValue(of(customFrame));

    processingService.getInteractions.and.returnValue(of([]));
    processingService.getStatus.and.returnValue(of('Active'));
    processingService.getObserverTypes.and.returnValue(of(observerTypes));
    processingService.getSelectedObserverType.and.returnValue(of(0));
    processingService.getInterval.and.returnValue(of(100));
    processingService.getRemoteProcessorSettings.and.returnValue(of({ ...remoteObserver }));
    processingService.setRemoteProcessorSettings.and.returnValue(of(new HttpResponse({ body: { ...remoteObserver } })));

    settingsService.getSettings.and.returnValue(of({ ...DEFAULT_SETTINGS }));
    settingsService.saveSettings.and.returnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.and.returnValue();

    fixture = TestBed.createComponent(ProcessingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    calibrationService.computeCalibratedAbsolutePosition.calls.reset();
    calibrationService.getFrameSize.calls.reset();

    processingService.getInteractions.calls.reset();
    processingService.getStatus.calls.reset();
    processingService.getObserverTypes.calls.reset();
    processingService.getSelectedObserverType.calls.reset();
    processingService.getInterval.calls.reset();
    processingService.getRemoteProcessorSettings.calls.reset();
    processingService.setRemoteProcessorSettings.calls.reset();

    settingsService.getSettings.calls.reset();
    settingsService.saveSettings.calls.reset();

    logService.sendErrorLog.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(1);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
    // BUG ?
    expect(processingService.getStatus).toHaveBeenCalledTimes(2);

    expect(processingService.getObserverTypes).toHaveBeenCalledTimes(1);
    expect(processingService.getSelectedObserverType).toHaveBeenCalledTimes(1);
    expect(processingService.getInterval).toHaveBeenCalledTimes(1);
    expect(processingService.getRemoteProcessorSettings).toHaveBeenCalledTimes(1);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);

    expect(settingsService.saveSettings).not.toHaveBeenCalled();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('loads, updates and saves gzip compression through the shared checkbox', async () => {
    fixture.detectChanges();
    component.selectedProcessorIdx = 3;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('#processing-remote-gzipCompression-checkbox');
    expect(checkbox.checked).toBeTrue();

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.remoteSettings.useGzipCompression).toBeFalse();
    expect(processingService.setRemoteProcessorSettings).toHaveBeenCalledWith(jasmine.objectContaining({
      useGzipCompression: false,
      address: remoteObserver.address,
      factor: remoteObserver.factor
    }));

    component.saveRemoteProcessingSettings();
    expect(settingsService.saveSettings).toHaveBeenCalledWith(jasmine.objectContaining({
      remoteProcessingServiceSettingsValues: jasmine.objectContaining({ useGzipCompression: false })
    }));

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(processingService.setRemoteProcessorSettings.calls.mostRecent().args[0].useGzipCompression).toBeTrue();
  });
});
