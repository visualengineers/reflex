import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import {
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockPanelHeaderComponent,
  PanelHeaderComponent
} from '@reflex/angular-components/dist';
import {
  DEFAULT_SETTINGS
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import type { Mock } from 'vitest';
import { LogService } from '../log/log.service';
import { CalibrationComponent } from './calibration.component';
import { calibrationService, customFrame, defaultInteractionData, identityCalibrationMatrix, logService, processingService, settingsService, sourcePoints, targetPoints } from './calibration.component.test-data';
export let submitSpy: Mock;

export let component: CalibrationComponent;

export let fixture: ComponentFixture<CalibrationComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, CalibrationComponent],
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
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(CalibrationComponent, {
        remove: { imports: [PanelHeaderComponent] },
        add: { imports: [MockPanelHeaderComponent] }
      })
      .compileComponents();
  });

  beforeEach(() => {
    // reset services
    calibrationService.getCalibrationMatrix.mockReturnValue(
      of(identityCalibrationMatrix)
    );
    calibrationService.getCalibrationSourcePoints.mockReturnValue(
      of(sourcePoints)
    );
    calibrationService.getCurrentCalibrationTargetPoints.mockReturnValue(
      of(targetPoints)
    );
    calibrationService.getFrameSize.mockReturnValue(of(customFrame));
    calibrationService.computeCalibratedAbsolutePosition.mockReturnValue(
      of(defaultInteractionData)
    );
    calibrationService.restartCalibration.mockReturnValue(
      of(identityCalibrationMatrix)
    );

    processingService.getInteractions.mockReturnValue(of([]));
    processingService.getStatus.mockReturnValue(of('Active'));

    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));
    settingsService.update.mockReturnValue(undefined);

    logService.sendErrorLog.mockReturnValue(undefined);

    fixture = TestBed.createComponent(CalibrationComponent);
    component = fixture.componentInstance;

    submitSpy = vi.spyOn(component, 'submit');
  });

  afterEach(() => {
    calibrationService.getCalibrationMatrix.mockClear();
    calibrationService.getCalibrationSourcePoints.mockClear();
    calibrationService.getCurrentCalibrationTargetPoints.mockClear();
    calibrationService.getFrameSize.mockClear();
    calibrationService.computeCalibratedAbsolutePosition.mockClear();
    calibrationService.updateCalibrationPoint.mockClear();
    calibrationService.updateFrameSize.mockClear();
    calibrationService.restartCalibration.mockClear();

    processingService.getInteractions.mockClear();
    processingService.getStatus.mockClear();

    settingsService.getSettings.mockClear();
    settingsService.update.mockClear();

    logService.sendErrorLog.mockClear();

    component.resetCalibration();
    component.calibrationMatrix = identityCalibrationMatrix.transformation;

    submitSpy.mockClear();
  });
}
