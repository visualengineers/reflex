import { Component, Input, OnInit } from '@angular/core';
import { of, Subscription } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { CameraConfiguration } from 'src/shared/config/cameraConfiguration';
import { RecordingService } from 'src/shared/services/recording.service';
import { DepthCameraState } from 'src/shared/tracking/depthCameraState';
import { RecordingState } from 'src/shared/tracking/recordingState';
import { RecordingStateUpdate } from 'src/shared/tracking/recordingStateUpdate';
import { TrackingConfigState } from 'src/shared/tracking/trackingConfigState';

@Component({
  selector: 'app-recording',
  templateUrl: './recording.component.html',
  styleUrls: ['./recording.component.scss']
})
export class RecordingComponent implements OnInit {

  @Input()
  public recordingName = 'default';

  public recordingEnabled = false;
  public recordingPath = '';
  public isRecording = false;

  public isDeleting = false;

  public recordingState: RecordingStateUpdate = {
    state: RecordingState.Stopped,
    framesRecorded: 0,
    sessionName: ''
  };

  public recordings: Array<CameraConfiguration> = [];

  private trackingStateSubscription?: Subscription;
  private readonly recordingStateSubscription?: Subscription;

  public constructor(private readonly recordingService: RecordingService, private readonly loggingService: LogService) {

  }

  public get recordingStateLabel(): string {
    return this.recordingState != null ? RecordingState[this.recordingState.state] : RecordingState[RecordingState.Stopped];
  }

  public ngOnInit(): void {
    this.trackingStateSubscription = this.recordingService.getStatus()
      .subscribe(
        (result) => this.updateTrackingState(result),
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
        }
      );

    this.updateRecordingsList();
  }

  public ngOnDestroy(): void {
    this.trackingStateSubscription?.unsubscribe();
    this.recordingStateSubscription?.unsubscribe();
  }

  public startRecording(): void {
    if (!this.recordingName || this.recordingName.length === 0) {
      this.loggingService.sendErrorLog('Cannot start recording: invalid name');

      return;
    }

    if (!this.recordingEnabled) {
      this.loggingService.sendErrorLog('Cannot start recording: Recording disabled.');

      return;
    }

    const start = this.recordingService.startRecording(this.recordingName).pipe(
      tap((recordingPath) => {
        this.recordingPath = recordingPath;
      }),
      tap(() => {
        this.updateRecordingsList();
      }),
      catchError((error) => {
        console.error(error);
        this.loggingService.sendErrorLog(`${error}`);

        return of('');
      })
    );

    const update = this.recordingService.getRecordingState().pipe(
      catchError((error) => {
        console.error(error);
        this.loggingService.sendErrorLog(`${error}`);

        return of({ state: RecordingState.Faulted, framesRecorded: 0, sessionName: '' });
      })
    );

    start.pipe(mergeMap(() => update)).subscribe(
      (recordingState) => this.updateRecordingState(recordingState),
      (error) => {
        console.error(error);
        this.loggingService.sendErrorLog(`${error}`);
      }
    );
  }

  public stopRecording(): void {
    this.recordingService.stopRecording().subscribe(() => {
      this.updateRecordingsList();
      this.recordingStateSubscription?.unsubscribe();
      this.recordingState = {
        state: RecordingState.Stopped,
        framesRecorded: 0,
        sessionName: ''
      };
      this.isRecording = false;
    }, (error) => {
      console.error(error);
      this.loggingService.sendErrorLog(`${error}`);
    });
  }

  public deleteRecording(cfg: CameraConfiguration): void {
    if (this.isRecording && cfg.name === this.recordingState.sessionName) {
      return;
    }

    this.isDeleting = true;

    this.recordingService.deleteRecording(cfg.name).subscribe(() => {
      this.updateRecordingsList();
      this.isDeleting = false;
    }, (error) => {
      console.error(error);
      this.loggingService.sendErrorLog(`${error}`);
    });
  }

  public clearRecordings(): void {
    if (this.isRecording) {
      return;
    }

    this.isDeleting = true;

    this.recordingService.clearRecordings().subscribe(() => {
      this.updateRecordingsList();
      this.isDeleting = false;
    }, (error) => {
      console.error(error);
      this.loggingService.sendErrorLog(`${error}`);
    });
  }

  public recordingNameChanged(): void {
    this.recordingEnabled = typeof this.recordingName === 'string' && this.recordingName.trim().length > 0;
  }

  private updateRecordingsList(): void {
    this.recordingService.getRecordings().subscribe(
      (result) => {
        this.recordings = result;
      },
      (error) => {
        console.error(error);
        this.loggingService.sendErrorLog(`${error}`);
      }
    );
  }

  private updateTrackingState(status: TrackingConfigState): void {
    this.recordingEnabled = status.depthCameraStateName === DepthCameraState[DepthCameraState.Streaming];
  }

  private updateRecordingState(status: RecordingStateUpdate): void {
    this.isRecording = status.state === RecordingState.Recording;
    this.recordingState = status;
  }
}
