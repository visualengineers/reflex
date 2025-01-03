import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasureControlsComponent } from './measure-controls.component';
import { LogService } from 'src/app/log/log.service';
import { MeasureService } from 'src/shared/services/measure.service';
import { FormsModule } from '@angular/forms';
import { interval, of, throwError, timer } from 'rxjs';
import { delay } from 'rxjs/operators';

const measureService = jasmine.createSpyObj<MeasureService>('fakeMeasureService',
  [
    'isCapturing',
    'getCurrentSampleIdx',
    'startCapture'
  ]
);

const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]);

describe('MeasureControlsComponent', () => {
  let component: MeasureControlsComponent;
  let fixture: ComponentFixture<MeasureControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        FormsModule,
        MeasureControlsComponent
    ],
    providers: [
        {
            provide: MeasureService, useValue: measureService
        },
        {
            provide: LogService, useValue: logService
        }
    ]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasureControlsComponent);
    measureService.isCapturing.and.returnValue(of(true));
    measureService.getCurrentSampleIdx.and.returnValue(of(123));
    measureService.startCapture.and.returnValue(of('#1234'));

    component = fixture.componentInstance;

  });

  afterEach(() => {
    measureService.isCapturing.calls.reset();
    measureService.getCurrentSampleIdx.calls.reset();
    measureService.startCapture.calls.reset();
    logService.sendErrorLog.calls.reset();
  });

  it('should create', () => {

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.captureId).toBe(0);
    expect(component.isCapturing).toBe(false);
    expect(component.numFramesCaptured).toBe(0);
    expect(measureService.startCapture).toHaveBeenCalledTimes(0);
  });

  it('should correctly subscribe to sample index', (done) => {

    const sub = interval(50).subscribe(
      () => {
        component.ngOnDestroy();
        expect(logService.sendErrorLog).not.toHaveBeenCalled();
        expect(component.isCapturing).toBe(true);
        expect(component.numFramesCaptured).toBe(123);
        sub.unsubscribe();
        done();
     },
     (error: unknown) => fail(error)
    )

    fixture.detectChanges();
  });

  it('should correctly start capture', () => {
    fixture.detectChanges();

    expect(measureService.startCapture).toHaveBeenCalledTimes(0);

    component.captureId = 12345;

    component.captureFrames();
    expect(measureService.startCapture).toHaveBeenCalledOnceWith(12345);
  });

  it('should handle errors correctly: IsCapturing', (done) => {
    const errorCapturing = 'TestError: measureService.isCapturing';
    measureService.isCapturing.and.returnValue(throwError(errorCapturing));

    const sub = interval(50).subscribe(
      () => {
        component.ngOnDestroy();
        expect(component.numFramesCaptured).toBe(0);
        expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCapturing);
        sub.unsubscribe();
        done();
     },
     (error: unknown) => fail(error)
    )

    fixture.detectChanges();
  });

  it('should handle errors correctly: getCurrentSampleIdx', (done) => {
    const errorSampleIdx = 'TestError: measureService.getCurrentSampleIdx';
    measureService.getCurrentSampleIdx.and.returnValue(throwError(errorSampleIdx));

    const sub = interval(50).subscribe(
      () => {
        component.ngOnDestroy();
        expect(component.isCapturing).toBe(true);
        expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSampleIdx);
        sub.unsubscribe();
        done();
     },
     (error: unknown) => fail(error)
    )

    fixture.detectChanges();
  });

  it('should handle errors correctly: StartCapture', () => {
    const errorStart = 'TestError: measureService.startCapture';
    measureService.startCapture.and.returnValue(throwError(errorStart));

    fixture.detectChanges();

    component.captureId = 12345;

    component.captureFrames();

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorStart);
  });

});
