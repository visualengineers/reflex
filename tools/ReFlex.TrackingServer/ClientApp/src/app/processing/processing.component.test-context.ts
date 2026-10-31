import { HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  MockValueSliderComponent,
  PanelHeaderComponent,
  ValueSelectionComponent,
  ValueSliderComponent
} from '@reflex/angular-components/dist';
import {
  DEFAULT_SETTINGS
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { LogService } from '../log/log.service';
import { HistoryVisualizationComponent } from './history-visualization/history-visualization.component';
import { MockHistoryVisualizationComponent } from './history-visualization/history-visualization.component.mock';
import { HistoryComponent } from './history/history.component';
import { MockHistoryComponent } from './history/history.component.mock';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import { MockInteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component.mock';
import { InteractionsComponent } from './interactions/interactions.component';
import { MockInteractionsComponent } from './interactions/interactions.component.mock';
import { ProcessingComponent } from './processing.component';
import { calibrationService, customFrame, interactionData, logService, observerTypes, processingService, remoteObserver, settingsService } from './processing.component.test-data';

export let component: ProcessingComponent;

export let fixture: ComponentFixture<ProcessingComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ProcessingComponent],
      providers: [
        {
          provide: CalibrationService,
          useValue: calibrationService
        },
        {
          provide: ProcessingService,
          useValue: processingService
        },
        {
          provide: SettingsService,
          useValue: settingsService
        },
        {
          provide: LogService,
          useValue: logService
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost'
        }
      ]
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
            HistoryComponent
          ]
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockValueSliderComponent,
            MockInteractionsComponent,
            MockInteractionsVisualizationComponent,
            MockHistoryVisualizationComponent,
            MockHistoryComponent
          ]
        }
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
}
