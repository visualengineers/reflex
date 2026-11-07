import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CompleteInteractionData,
  ElementPosition,
  ExtremumDescription,
  ExtremumType,
  FrameSizeDefinition,
  Interaction,
  InteractionVelocity
} from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { InteractionsVelocityVisualizationComponent } from '../interactions-velocity-visualization/interactions-velocity-visualization.component';
import { HistoryVisualizationComponent } from '../history-visualization/history-visualization.component';

@Component({
  selector: 'app-interactions-visualization',
  templateUrl: './interactions-visualization.component.html',
  styleUrls: ['./interactions-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, HistoryVisualizationComponent, InteractionsVelocityVisualizationComponent]
})
export class InteractionsVisualizationComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('interactionVis')
  public container?: ElementRef<HTMLDivElement>;

  @Input() public isProcessing = false;
  @Input() public showPrediction = true;
  @Input() public showMatching = true;
  @Input() public showLinear = true;
  @Input() public showAccelerated = true;
  public predictionData: Array<InteractionVelocity> = [];
  public predictionMessage = '';

  public interactions: CompleteInteractionData = {
    raw: [],
    absolute: [],
    normalized: []
  };

  public calibratedInteractions: Array<Interaction> = [];

  public fullScreen = false;
  public maxConfidence = 30;
  private predictionSubscription?: Subscription;
  private readonly processingService = inject(ProcessingService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly calibrationService = inject(CalibrationService);
  private readonly logService = inject(LogService);

  private frameSizeSubscription?: Subscription;
  private frameSize: FrameSizeDefinition = {
    top: 0,
    left: 0,
    width: 500,
    height: 400
  };

  private pEventId = 0;

  public get eventId(): number {
    return this.pEventId;
  }

  @Input()
  public set eventId(value: number) {
    this.pEventId = value;
  }

  public ngOnChanges(): void {
    if (!this.isProcessing || !this.showPrediction) {
      this.predictionSubscription?.unsubscribe();
      this.predictionSubscription = undefined;
      this.predictionData = [];

      return;
    }
    if (this.predictionSubscription && !this.predictionSubscription.closed) {
      return;
    }
    this.predictionMessage = '';
    this.predictionSubscription = this.processingService.getVelocities()
      .pipe(markViewForCheck(this.changeDetector)).subscribe({
        next: (data) => {
          this.predictionData = data;
        },
        error: () => {
          this.predictionMessage = 'Prediction stream disconnected.';
          this.predictionData = [];
        }
      });
  }

  public ngOnInit(): void {
    this.frameSizeSubscription = this.calibrationService
      .getFrameSize()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.frameSize = result;
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public ngOnDestroy(): void {
    this.predictionSubscription?.unsubscribe();
    this.frameSizeSubscription?.unsubscribe();
  }

  public getInteractionsViewStyle(): ElementPosition {
    if (this.fullScreen) {
      return {
        position: 'absolute',
        top: `${this.frameSize.top}px`,
        left: `${this.frameSize.left}px`,
        width: `${this.frameSize.width}px`,
        height: `${this.frameSize.height}px`
      };
    }

    return {
      position: 'relative',
      top: `0`,
      left: `0`,
      width: `100%`,
      height: `40vh`
    };
  }

  public updateCalibratedInteractions(result: CompleteInteractionData): void {
    this.interactions = result;

    this.calibratedInteractions = this.fullScreen
      ? result.absolute
      : result.normalized;

    // Also used imperatively by ProcessingComponent through ViewChild.
    this.changeDetector.markForCheck();

    if (this.container === undefined) {
      return;
    }

    this.calibratedInteractions.forEach((int) => {
      int.position.x = this.fullScreen
        ? int.position.x - this.frameSize.left
        : int.position.x
          * ((this.container?.nativeElement as HTMLElement | undefined)
            ?.clientWidth ?? 0);
      int.position.y = this.fullScreen
        ? int.position.y - this.frameSize.top
        : int.position.y
          * ((this.container?.nativeElement as HTMLElement | undefined)
            ?.clientHeight ?? 0);
      int.position.z = Math.abs(int.position.z) * 2;
    });
  }

  public getClass(extremum: ExtremumDescription): string {
    const extremumDef = extremum.type;

    if (extremumDef === ExtremumType.Undefined) {
      return 'interaction-undefined';
    }

    if (extremumDef === ExtremumType.Maximum) {
      return 'interaction-maximum';
    }

    if (extremumDef === ExtremumType.Minimum) {
      return 'interaction-minimum';
    }

    return 'interaction-invalid';
  }
}
