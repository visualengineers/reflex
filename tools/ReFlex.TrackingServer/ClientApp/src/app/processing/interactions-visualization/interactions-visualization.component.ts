import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  SimpleChanges,
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
import { Subscription, exhaustMap, tap } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { InteractionsVelocityVisualizationComponent } from '../interactions-velocity-visualization/interactions-velocity-visualization.component';
import { calibratePredictions } from './calibrate-predictions';
import { HistoryVisualizationComponent } from '../history-visualization/history-visualization.component';

@Component({
  selector: 'app-interactions-visualization',
  templateUrl: './interactions-visualization.component.html',
  styleUrls: ['./interactions-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, HistoryVisualizationComponent, InteractionsVelocityVisualizationComponent]
})
export class InteractionsVisualizationComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @ViewChild('interactionVis')
  public container?: ElementRef<HTMLDivElement>;

  @Input() public isProcessing = false;
  @Input() public showPrediction = true;
  @Input() public showMatching = true;
  @Input() public showLinear = true;
  @Input() public showAccelerated = true;
  @Output() public predictionDataChange = new EventEmitter<Array<InteractionVelocity>>(true);
  public viewportWidth = 500;
  public viewportHeight = 400;
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
  private resizeObserver?: ResizeObserver;
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

  public ngOnChanges(changes: SimpleChanges): void {
    if (!('isProcessing' in changes) && !('showPrediction' in changes)) {
      return;
    }
    if (!this.isProcessing || !this.showPrediction) {
      this.predictionSubscription?.unsubscribe();
      this.predictionSubscription = undefined;
      this.predictionData = [];
      this.predictionDataChange.emit([]);

      return;
    }
    if (this.predictionSubscription && !this.predictionSubscription.closed) {
      return;
    }
    this.predictionMessage = '';
    this.predictionSubscription = this.processingService.getVelocities()
      .pipe(
        tap((data) => this.predictionDataChange.emit(data)),
        exhaustMap((data) => calibratePredictions(data, this.calibrationService)),
        markViewForCheck(this.changeDetector)
      ).subscribe({
        next: (data) => {
          this.predictionData = data;
        },
        error: () => {
          this.predictionMessage = 'Prediction stream or calibration unavailable.';
          this.predictionData = [];
          this.predictionDataChange.emit([]);
        }
      });
  }

  public ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.updateCalibratedInteractions(this.interactions));
    if (this.container) {
      this.resizeObserver.observe(this.container.nativeElement);
    }
  }

  public ngOnInit(): void {
    this.frameSizeSubscription = this.calibrationService
      .getFrameSize()
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => {
          this.frameSize = result;
          this.updateCalibratedInteractions(this.interactions);
        },
        (error) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
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

    const width = this.container?.nativeElement.clientWidth ?? 0;
    const height = this.container?.nativeElement.clientHeight ?? 0;
    this.viewportWidth = this.fullScreen ? this.frameSize.width : width > 0 ? width : 500;
    this.viewportHeight = this.fullScreen ? this.frameSize.height : height > 0 ? height : 400;
    const source = this.fullScreen ? result.absolute : result.normalized;
    this.calibratedInteractions = source.map((item) => ({
      ...item,
      position: {
        ...item.position,
        x: this.fullScreen ? item.position.x - this.frameSize.left : item.position.x * this.viewportWidth,
        y: this.fullScreen ? item.position.y - this.frameSize.top : item.position.y * this.viewportHeight,
        z: Math.abs(item.position.z) * 2
      }
    }));
    // Also used imperatively by ProcessingComponent through ViewChild.
    this.changeDetector.markForCheck();
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
