import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

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
import { PanelHeaderComponent, ValueSelectionComponent, ValueSliderComponent, OptionCheckboxComponent, MockOptionCheckboxComponent, MockPanelHeaderComponent, MockValueSelectionComponent, MockValueSliderComponent } from '@reflex/angular-components/dist';
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
    'getRemoteProcessorSettings'

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
  address: '',
  numSkipValues: 0,
  completeDataSet: false,
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
            provide: 'BASE_URL', useValue: 'http://localhost'
        }
    ]
    }).overrideComponent(ProcessingComponent, {
      remove: { imports: [
        PanelHeaderComponent,
        ValueSelectionComponent,
        ValueSliderComponent,
        OptionCheckboxComponent,
        InteractionsComponent,
        InteractionsVisualizationComponent,
        HistoryVisualizationComponent,
        HistoryComponent
      ] },
      add: { imports: [
        MockPanelHeaderComponent,
        MockValueSelectionComponent,
        MockValueSliderComponent,
        MockOptionCheckboxComponent,
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
    processingService.getRemoteProcessorSettings.and.returnValue(of(remoteObserver));

    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
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
});
