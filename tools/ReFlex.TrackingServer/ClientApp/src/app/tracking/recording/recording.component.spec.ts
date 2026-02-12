import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { RecordingService } from 'src/shared/services/recording.service';
import { RecordingComponent } from './recording.component';
import { CameraConfiguration, DepthCameraState, RecordingState, RecordingStateUpdate } from '@reflex/shared-types';
import { ValueTextComponent, MockValueTextComponent } from '@reflex/angular-components/dist';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';


const recordingService = jasmine.createSpyObj<RecordingService>('fakeRecordingService',
  [
    'getStatus',
    'getRecordings',
    'getRecordingState',
    'startRecording',
    'stopRecording',
    'deleteRecording',
    'clearRecordings'
  ]);

const recordingService_error = jasmine.createSpyObj<RecordingService>('fakeRecordingService',
  [
    'getStatus',
    'getRecordings',
    'getRecordingState',
    'startRecording',
    'stopRecording',
    'deleteRecording',
    'clearRecordings'
  ]);

const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]);

const testRecordingCam : CameraConfiguration = {
  name: 'RecordedTest',
  framerate: 30,
  width: 640,
  height: 480
}

recordingService.getStatus.and.returnValue(of({
  isCameraSelected: true,
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming],
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig'
}));

const testRecordingPath = 'Path/to/TestRecording.xyz'

recordingService.startRecording.and.returnValue(of(testRecordingPath));

const testRecordingStateUpdate: RecordingStateUpdate = {
  state: RecordingState.Recording,
  framesRecorded: 1,
  sessionName: testRecordingCam.name,
};

recordingService.stopRecording.and.returnValue(of(testRecordingCam));

recordingService.getRecordingState.and.returnValue(of(testRecordingStateUpdate));

const recordingList: Array<CameraConfiguration> = [
  {
    name: 'TestCam',
    framerate: 30,
    width: 100,
    height: 50
  },
  {
    name: 'TestCam 2',
    framerate: 45,
    width: 320,
    height: 240
  }
]

recordingService.getRecordings.and.returnValue(of(recordingList));

recordingService.deleteRecording.and.returnValue(of('Successfully deleted recording'));

recordingService.clearRecordings.and.returnValue(of('Successfully deleted all recordings'));

const errorStatus = 'TestError: getStatus()';
recordingService_error.getStatus.and.returnValue(throwError(errorStatus));

const errorRecordings = 'TestError: getRecordings()';
recordingService_error.getRecordings.and.returnValue(throwError(errorRecordings));

const errorRecordingState = 'TestError: getRecordingState()';
recordingService_error.getRecordingState.and.returnValue(throwError(errorRecordingState));

const errorStart = 'TestError: startRecording()';
recordingService_error.startRecording.and.returnValue(throwError(errorStart));

const errorStop = 'TestError: stopRecording()';
recordingService_error.stopRecording.and.returnValue(throwError(errorStop));

const errorDelete = 'TestError: deleteRecording()';
recordingService_error.deleteRecording.and.returnValue(throwError(errorDelete));

const errorClear = 'TestError: clearRecordings()';
recordingService_error.clearRecordings.and.returnValue(throwError(errorClear));

describe('RecordingComponent', () => {
  let component: RecordingComponent;
  let fixture: ComponentFixture<RecordingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        FormsModule,
        RecordingComponent
    ],
    providers: [
        {
            provide: RecordingService, useValue: recordingService
        },
        {
            provide: LogService, useValue: logService
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
    })
    .overrideComponent(RecordingComponent, {
      remove: { imports: [ ValueTextComponent] },
      add: { imports: [ MockValueTextComponent ] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    recordingService.getStatus.calls.reset();
    recordingService.getRecordings.calls.reset();
    recordingService.getRecordingState.calls.reset();
    recordingService.startRecording.calls.reset();
    recordingService.stopRecording.calls.reset();
    recordingService.deleteRecording.calls.reset();
    recordingService.clearRecordings.calls.reset();

    logService.sendErrorLog.calls.reset();
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Subscriptions correctly', async () => {
    await fixture.whenStable();

    expect(recordingService.getStatus).toHaveBeenCalledTimes(1);
    expect(component.recordings).toEqual(recordingList);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component['trackingStateSubscription']).toBeDefined();
  });

  it('should correctly start recording', async () => {
    expect(component.recordingEnabled).toBeTrue();
    expect(component.recordingName).not.toHaveSize(0);

    component.startRecording();

    await fixture.whenStable();

    expect(recordingService.startRecording).toHaveBeenCalledOnceWith(component.recordingName);

    expect(recordingService.getRecordingState).toHaveBeenCalledTimes(1);

    expect(recordingService.getRecordings).toHaveBeenCalledTimes(2);

    expect(component.recordingPath).toEqual(testRecordingPath);

    expect(component.isRecording).toBeTrue();

    expect(component.recordingState).toEqual(testRecordingStateUpdate);
  });

  it('should correctly stop recording', async () => {
    expect(component.recordingEnabled).toBeTrue();
    expect(component.recordingName).not.toHaveSize(0);

    component.startRecording();

    await fixture.whenStable();

    expect(component.isRecording).toBeTrue();

    expect(component.recordingState.state).toEqual(RecordingState.Recording);

    component.stopRecording();

    await fixture.whenStable();

    expect(component.isRecording).toBeFalse();
    expect(component.recordingState).toBeDefined();
    expect(component.recordingState.state).toEqual(RecordingState.Stopped);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.stopRecording).toHaveBeenCalledTimes(1);

  });

  it('should correctly delete recording', async () => {
    recordingService.getRecordings.calls.reset();

    expect(component.recordingEnabled).toBeTrue();
    expect(component.recordingName).not.toHaveSize(0);

    component.deleteRecording(testRecordingCam);

    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.deleteRecording).toHaveBeenCalledOnceWith(testRecordingCam.name);
    expect(recordingService.getRecordings).toHaveBeenCalledTimes(1);
  });

  it('should not delete currently running recording', async () => {
    expect(component.recordingEnabled).toBeTrue();
    expect(component.recordingName).not.toHaveSize(0);

    component.startRecording();

    await fixture.whenStable();

    recordingService.getRecordings.calls.reset();

    expect(component.isRecording).toBeTrue();
    expect(component.recordingState.sessionName).toEqual(testRecordingCam.name);

    component.deleteRecording(testRecordingCam);

    expect(recordingService.deleteRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(recordingService.getRecordings).not.toHaveBeenCalled();
  });

  it('should correctly clear recordings', async () => {
    recordingService.getRecordings.calls.reset();

    expect(component.recordingEnabled).toBeTrue();
    expect(component.recordingName).not.toHaveSize(0);

    expect(component.isRecording).toBeFalse();

    component.clearRecordings();

    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.clearRecordings).toHaveBeenCalledTimes(1);
    expect(recordingService.getRecordings).toHaveBeenCalledTimes(1);
  });

  it('should not clear recordings when currently recording', async () => {
    expect(component.recordingEnabled).toBeTrue();
    expect(component.recordingName).not.toHaveSize(0);

    component.startRecording();

    await fixture.whenStable();

    recordingService.getRecordings.calls.reset();

    expect(component.isRecording).toBeTrue();

    component.clearRecordings();

    expect(recordingService.clearRecordings).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(recordingService.getRecordings).not.toHaveBeenCalled();
  });

  it ('should unsubscribe completely onDestroy', async () => {
    await fixture.whenStable();

    component.ngOnDestroy();

    expect(component['trackingStateSubscription']?.closed).toBeTruthy();
    expect(component['recordingStateSubscription'] === undefined || component['recordingStateSubscription'].closed).toBeTrue();
  });

  it('should enable recording when correct name is passed', async () => {
    expect(component.recordingName).toBeInstanceOf(String);

    expect(component.recordingEnabled).toBeTrue();

    component.recordingName = '';

    component.recordingNameChanged();

    expect(component.recordingEnabled).toBeFalse();

    component.recordingName = 'TEST2';

    component.recordingNameChanged();

    expect(component.recordingEnabled).toBeTrue();

    component.recordingName = '   ';

    component.recordingNameChanged();

    expect(component.recordingEnabled).toBeFalse();
  })
});


describe('RecordingComponent: Error Handling', () => {
  let component: RecordingComponent;
  let fixture: ComponentFixture<RecordingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        FormsModule,
        ValueTextComponent,
        RecordingComponent
      ],
    providers: [
        {
            provide: RecordingService, useValue: recordingService_error
        },
        {
            provide: LogService, useValue: logService
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    recordingService_error.getStatus.calls.reset();
    recordingService_error.getRecordings.calls.reset();
    recordingService_error.getRecordingState.calls.reset();
    recordingService_error.startRecording.calls.reset();
    recordingService_error.stopRecording.calls.reset();
    recordingService_error.deleteRecording.calls.reset();
    recordingService_error.clearRecordings.calls.reset();

    logService.sendErrorLog.calls.reset();
  });

  it('should handle errors correctly', async () => {
    await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorRecordings);
  });

  it ('should start recording only when enabled and correct name given', async () => {
    await fixture.whenStable();

    expect(component.recordingEnabled).toBeFalse();

    component.startRecording();

    await fixture.whenStable();

    expect(recordingService_error.startRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(3);

    component.recordingEnabled = true;
    component.recordingName = '';

    component.startRecording();

    await fixture.whenStable();

    expect(recordingService_error.startRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(4);

    component.recordingName = 'Test';

    component.startRecording();

    await fixture.whenStable();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);
    expect(recordingService_error.startRecording).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStart);

    expect(recordingService_error.getRecordingState).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorRecordingState);

    expect(component.isRecording).toBeFalse();

    expect(component.recordingState).toBeDefined();
    expect(component.recordingState.state).toEqual(RecordingState.Faulted);

    component.stopRecording();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7);
    expect(recordingService_error.stopRecording).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStop);

    component.deleteRecording(testRecordingCam);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(8);
    expect(recordingService_error.deleteRecording).toHaveBeenCalledOnceWith(testRecordingCam.name);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorDelete);

    component.clearRecordings();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(9);
    expect(recordingService_error.clearRecordings).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorClear);
  });
});
