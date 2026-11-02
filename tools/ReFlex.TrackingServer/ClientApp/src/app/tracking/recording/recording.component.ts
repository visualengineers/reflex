import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ValueSelectionComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import {
  CameraConfiguration,
  DepthCameraState,
  RecordingState,
  RecordingStateUpdate,
  TrackingConfigState
} from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { RecordingService } from 'src/shared/services/recording.service';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';

@Component({
  selector: 'app-recording',
  templateUrl: './recording.component.html',
  styleUrls: ['./recording.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, ValueTextComponent, ValueSelectionComponent]
})
export class RecordingComponent implements OnInit, OnDestroy {

  @Input()
  public recordingName = 'default';

  public usePng = false;

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
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly recordingService = inject(RecordingService);
  private readonly loggingService = inject(LogService);

  private trackingStateSubscription?: Subscription;
  private recordingStateSubscription?: Subscription;

  public get recordingStateLabel(): string {
    return this.recordingState != null
      ? RecordingState[this.recordingState.state]
      : RecordingState[RecordingState.Stopped];
  }

  public ngOnInit(): void {
    this.trackingStateSubscription = this.recordingService
      .getStatus()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => this.updateTrackingState(result),
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
        }
      );

    this.recordingStateSubscription = this.recordingService
      .getRecordingState()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (status) => this.updateRecordingState(status),
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
          this.updateRecordingState({
            state: RecordingState.Faulted,
            framesRecorded: 0,
            sessionName: ''
          });
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
      this.loggingService.sendErrorLog(
        'Cannot start recording: Recording disabled.'
      );

      return;
    }

    this.recordingService.startRecording(this.recordingName, this.usePng)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (recordingPath) => {
          this.recordingPath = recordingPath;
          this.updateRecordingsList();
        },
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
        }
      );
  }

  public stopRecording(): void {
    this.recordingService
      .stopRecording()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        () => {
          this.updateRecordingsList();
          this.recordingState = {
            state: RecordingState.Stopped,
            framesRecorded: 0,
            sessionName: ''
          };
          this.isRecording = false;
        },
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
        }
      );
  }

  public deleteRecording(cfg: CameraConfiguration): void {
    if (this.isRecording && cfg.name === this.recordingState.sessionName) {
      return;
    }

    this.isDeleting = true;

    this.recordingService
      .deleteRecording(cfg.name)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        () => {
          this.updateRecordingsList();
          this.isDeleting = false;
        },
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
        }
      );
  }

  public clearRecordings(): void {
    if (this.isRecording) {
      return;
    }

    this.isDeleting = true;

    this.recordingService
      .clearRecordings()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        () => {
          this.updateRecordingsList();
          this.isDeleting = false;
        },
        (error) => {
          console.error(error);
          this.loggingService.sendErrorLog(`${error}`);
        }
      );
  }

  public recordingNameChanged(): void {
    this.recordingEnabled
      = typeof this.recordingName === 'string'
      && this.recordingName.trim().length > 0;
  }

  private updateRecordingsList(): void {
    this.recordingService
      .getRecordings()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
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
    this.recordingEnabled
      = status.depthCameraStateName
      === DepthCameraState[DepthCameraState.Streaming];
  }

  private updateRecordingState(status: RecordingStateUpdate): void {
    this.isRecording = status.state === RecordingState.Recording;
    this.recordingState = status;
  }
}
