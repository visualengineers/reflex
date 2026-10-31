import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { MeasureService } from 'src/shared/services/measure.service';
import { MeasureControlsComponent } from './measure-controls.component';
import { logService, measureService } from './measure-controls.component.test-data';

export let component: MeasureControlsComponent;

export let fixture: ComponentFixture<MeasureControlsComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, MeasureControlsComponent],
      providers: [
        {
          provide: MeasureService,
          useValue: measureService
        },
        {
          provide: LogService,
          useValue: logService
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasureControlsComponent);
    measureService.isCapturing.mockReturnValue(of(true));
    measureService.getCurrentSampleIdx.mockReturnValue(of(123));
    measureService.startCapture.mockReturnValue(of('#1234'));

    component = fixture.componentInstance;
  });

  afterEach(() => {
    measureService.isCapturing.mockClear();
    measureService.getCurrentSampleIdx.mockClear();
    measureService.startCapture.mockClear();
    logService.sendErrorLog.mockClear();
  });
}
