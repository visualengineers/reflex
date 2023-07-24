/* eslint-disable max-lines */
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NEVER, Observable, Subscription } from 'rxjs';
import { catchError, concatMap, startWith, switchMap, tap } from 'rxjs/operators';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { LogService } from '../log/log.service';
import { Calibration, CalibrationPoint, CalibrationTransform, CompleteInteractionData, FrameSizeDefinition, Interaction, InteractionType, Point3 } from '@reflex/shared-types';

export interface TransformString {
  transform: string;
}

export interface BorderString {
  top: string;
  left: string;
  width: string;
  height: string;
}

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.scss']
})
export class CalibrationComponent implements OnInit {

  private static readonly fullScreenClassName = 'fullScreen';

  @ViewChild('calibrationView')
  private readonly view?: ElementRef;

  // TODO: toggle between Calbration / Borders and display of current calibration values
  public isInteractiveCalibrationVisible = false;


  public borderOffset: Array<number> = [0, 0, 0, 0];

  public calibrationSource: Array<CalibrationPoint> = [
    { positionX: 100, positionY: 200, touchId: -1 },
    { positionX: 600, positionY: 200, touchId: -1 },
    { positionX: 600, positionY: 700, touchId: -1 }
  ];

  public calibratedTargets: Array<CalibrationPoint> = [
    { positionX: 100, positionY: 200, touchId: -1 },
    { positionX: 600, positionY: 200, touchId: -1 },
    { positionX: 600, positionY: 700, touchId: -1 }
  ];

  public currentCalibration: Calibration
    = {
      lastUpdated: [],
      sourceValues: [],
      targetValues: [],
      lowerThreshold: 0,
      upperThreshold: 0
    };

  public calibrationMatrix: Array<Array<number>> = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ];

  public interactions: Array<Interaction> = [];

  public calibratedInteractions: Array<Interaction> = [];

  public isProcessingActive = false;

  public selectedValue: Array<Interaction> = [];
  public selectedIdx = 0;

  public update = false;
  public displayCalibratedInteractions = false;

  private currentlyActiveStage = -1;
  private selectedBorderIndex = -1;

  private interactionsSubscription?: Subscription;
  private calibrationSubscription?: Subscription;
  private readonly calibratedInteractionsSubscription?: Subscription;
  private settingsSubscription?: Subscription;
  private matrixSubscription?: Subscription;
  private maxConfidence = 30;

  private completeInteractions$?: Observable<CompleteInteractionData>;
  private isProcessing$?: Observable<string>;

  public constructor(
    private readonly renderer: Renderer2,
    private readonly processingService: ProcessingService,
    private readonly calibrationService: CalibrationService,
    private readonly settingsService: SettingsService,
    private readonly logService: LogService
  ) { }

  @HostListener('mousemove', ['$event'])
  public onmouseMove(evt: MouseEvent): void {
    if (this.selectedBorderIndex < 0 || this.selectedBorderIndex > 3) {
      return;
    }

    const offset = this.selectedBorderIndex === 0 || this.selectedBorderIndex === 2 ? evt.movementY : evt.movementX;

    let newOffset = this.borderOffset[this.selectedBorderIndex] + offset;

    if (newOffset < 0) {
      newOffset = 0;
    }

    // check if borders collide / are too close
    if ((this.selectedBorderIndex === 0 && this.borderOffset[2] - newOffset < 70)
        || (this.selectedBorderIndex === 1 && this.borderOffset[3] - newOffset < 70)
        || (this.selectedBorderIndex === 2 && newOffset - this.borderOffset[0] < 70)
        || (this.selectedBorderIndex === 3 && newOffset - this.borderOffset[1] < 70)) {
      return;
    }

    this.borderOffset[this.selectedBorderIndex] = newOffset;

  }

  public ngOnInit(): void {
    this.resetBorders();
    this.resetSelectedInteraction();

    const interactions$ = this.processingService.getInteractions().pipe(
      concatMap((result: Array<Interaction>) => this.calibrationService.computeCalibratedAbsolutePosition(result)),
      catchError((error: unknown) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);

        return [];
      })
    );

    this.isProcessing$ = this.processingService.getStatus();

    this.completeInteractions$ = this.isProcessing$
      .pipe(
        tap((processing) => {
          this.isProcessingActive = processing === 'Active';
        }),
        switchMap((processing) => processing
          ? interactions$
          : NEVER.pipe(startWith(
            { raw: [], normalized: [], absolute: [] }
          )))
      );

    this.settingsService.update();

    this.interactionsSubscription = this.completeInteractions$
      .subscribe(
        (result) => this.updateInteractions(result),
        (error: unknown) => {
          this.logService.sendErrorLog(`${error}`);
          console.error(error);
        }
      );

    this.settingsSubscription = this.settingsService.getSettings().subscribe((result) => {
      this.updateCalibrationValues(result.calibrationValues);
      this.maxConfidence = result.filterSettingValues.confidence.max;
    }, (error: unknown) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });


    this.calibrationSubscription = this.calibrationService.getFrameSize().subscribe((result) => {
      this.updateBorders(result);
    }, (error: unknown) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.matrixSubscription = this.calibrationService.getCalibrationMatrix().subscribe((result) => {
      this.calibrationMatrix = result.transformation;
    }, (error: unknown) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });

    this.updateSourceValues();

    this.updateTargetPoints();

  }

  public ngOnDestroy(): void {
    this.interactionsSubscription?.unsubscribe();
    this.settingsSubscription?.unsubscribe();
    this.calibrationSubscription?.unsubscribe();
    this.matrixSubscription?.unsubscribe();
  }

  public toggleCalibrationMode(): void {
    this.isInteractiveCalibrationVisible = !this.isInteractiveCalibrationVisible;

    if (this.view === undefined) {
      return;
    }

    if (this.isInteractiveCalibrationVisible) {
      this.renderer.addClass(this.view.nativeElement, CalibrationComponent.fullScreenClassName);
    } else {
      this.renderer.removeClass(this.view.nativeElement, CalibrationComponent.fullScreenClassName);
    }
  }

  public updateCalibrationToggle(): void {
    if (!this.update) {
      this.displayCalibratedInteractions = false;
      this.interactions = [];
      this.calibratedInteractions = [];
    }
  }

  public focusBorder(index: number): void {
    this.selectedBorderIndex = index;
  }

  public releaseBorder(index: number): void {
    if (this.selectedBorderIndex === index) {
      this.selectedBorderIndex = -1;
    }
  }

  public releaseAllBorders(): void {
    this.selectedBorderIndex = -1;
  }

  public resetBorders(): void {
    this.borderOffset = [100, 100, 500, 500];
  }

  public select(interactionIdx: number): void {
    if (interactionIdx === this.selectedIdx || interactionIdx >= this.interactions.length) {
      this.resetSelectedInteraction();

      return;
    }

    this.selectedValue[this.currentlyActiveStage] = this.interactions[interactionIdx];
    this.selectedIdx = interactionIdx;
  }

  public resetSelectedInteraction(): void {
    this.selectedValue = this.getDefaultSelectedValues();
    this.selectedIdx = -1;
  }

  public submit(): void {

    if (this.selectedIdx < 0
      || this.currentlyActiveStage < 0
      || this.currentlyActiveStage > 2
      || this.selectedValue.length < this.currentlyActiveStage + 1
      || this.selectedValue[this.currentlyActiveStage].touchId < 0) {
      return;
    }

    const pos: CalibrationPoint = {
      positionX: this.selectedValue[this.currentlyActiveStage].position.x,
      positionY: this.selectedValue[this.currentlyActiveStage].position.y,
      touchId: this.selectedValue[this.currentlyActiveStage].touchId
    };

    this.calibratedTargets[this.currentlyActiveStage] = pos;

    // todo: never returns ???
    this.calibrationSubscription = this.calibrationService.updateCalibrationPoint(this.currentlyActiveStage, pos)
      .subscribe((result: HttpResponse<CalibrationTransform>) => {
        this.handleUpdatedCalibration(result);
      }, (error: unknown) => {
        this.logService.sendErrorLog(`${error}`);
        console.error(error);
      });
  }

  public display(idx: number): void {
    if (idx < 0) {
      this.currentlyActiveStage = -1;
      this.resetSelectedInteraction();

      return;
    }

    if (idx > 2) {
      return;
    }

    this.currentlyActiveStage = idx;
  }

  public resetCalibration(): void {
    this.calibrationService.restartCalibration().subscribe(
      (result) => {
        this.calibrationMatrix = result.transformation;
        this.resetTarget(0);
        this.resetTarget(1);
        this.resetTarget(2);
      },
      (error) => console.error(error)
    );
    this.currentlyActiveStage = -1;
    this.resetSelectedInteraction();

  }

  public applyCalibration(): void {
    this.calibrationService.applyCalibration().subscribe(
      (result) => {
        this.calibrationMatrix = result.transformation;
        console.log(`${result.transformation}`);
      },
      (error: unknown) => {
        this.logService.sendErrorLog(`${error}`);
        console.error(error);
      }
    );
    this.currentlyActiveStage = -1;
    this.resetSelectedInteraction();
  }

  public updateFrameSize(): void {
    const frame: FrameSizeDefinition = { width: this.borderOffset[3] - this.borderOffset[1],
      height: this.borderOffset[2] - this.borderOffset[0],
      left: this.borderOffset[1],
      top: this.borderOffset[0] };

    this.calibrationService.updateFrameSize(frame).subscribe((result) => {
      if (result.body) {
        console.log(`received updated frame size - result:  ${result.status} - [${result.body.top} | ${result.body.left} | ${result.body.height} | ${result.body.width}]`);
        this.updateBorders(result.body);
      }
    }, (error: unknown) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  public getCalibrationSourcePointStyle(index: number): Object {
    return {
      transform: `translate(${this.calibrationSource[index].positionX}px, ${this.calibrationSource[index].positionY}px)`,
      visibility: `${this.currentlyActiveStage === index ? 'visible' : 'collapse'}`
    };
  }

  public getCalibrationTargetPointStyle(index: number): Object {
    return {
      transform: `translate(${this.calibratedTargets[index].positionX}px, ${this.calibratedTargets[index].positionY}px)`,
      visibility: `${this.currentlyActiveStage >= 0 ? 'visible' : 'collapse'}`
    };
  }

  public getCalibratedInteractionPointStyle(type: InteractionType, position: Point3): TransformString {
    const resultingPosition = position;

    const scale = ((resultingPosition.z * resultingPosition.z) + 0.5) * 2;

    return {
      transform: `translate(${resultingPosition.x}px, ${resultingPosition.y}px) scale(${scale}, ${scale})`
    };
  }

  public getBorderFill(): BorderString {
    return {
      top: `${this.borderOffset[0]}px`,
      left: `${this.borderOffset[1]}px`,
      height: `${this.borderOffset[2] - this.borderOffset[0]}px`,
      width: `${this.borderOffset[3] - this.borderOffset[1]}px`
    };
  }

  public saveCalibration(): void {
    this.calibrationService.saveCalibration().subscribe(
      (result) => {
        console.log(result);
      },
      (error: unknown) => {
        this.logService.sendErrorLog(`${error}`);
        console.error(error);
      }
    );
  }

  private getDefaultSelectedValues(): Array<Interaction> {
    return [
      this.getDefaultInteraction(),
      this.getDefaultInteraction(),
      this.getDefaultInteraction()
    ];
  }

  private getDefaultInteraction(): Interaction {
    return { touchId: -1, confidence: 0, position: { x: 0, y: 0, z: 0, isFiltered: true, isValid: false }, type: 0, extremumDescription: { numFittingPoints: 0, percentageFittingPoints: 0, type: 0 }, time: 0 };
  }

  private updateInteractions(interactions: CompleteInteractionData): void {
    if (!this.update) {
      return;
    }

    if (this.calibratedInteractionsSubscription !== undefined) {
      this.calibratedInteractionsSubscription.unsubscribe();
    }

    const maxItems = Math.min(interactions.raw.length, 3);
    const filtered = interactions.raw.slice(0, maxItems);

    this.interactions = filtered;

    this.calibratedInteractions = this.displayCalibratedInteractions ? interactions.absolute : filtered;

    if (this.currentlyActiveStage < 0 || this.currentlyActiveStage > 2) {
      this.resetSelectedInteraction();
    }

    // check if touch with current id has been set as target in another stage...
    const alreadySelectedIds = this.selectedValue.filter((elem, idx) => elem.touchId >= 0 && idx !== this.currentlyActiveStage).map((i) => i.touchId);
    if (this.interactions.length <= 0
      || alreadySelectedIds.find((id) => id === this.interactions[0].touchId) !== undefined) {
      this.selectedValue[this.currentlyActiveStage] = this.getDefaultInteraction();
      this.selectedIdx = -1;

      return;
    }

    let restore: Interaction | undefined;

    // restore index of selected touch id
    if (this.selectedValue[this.currentlyActiveStage]?.touchId >= 0) {
      restore = this.interactions.find((touch) => touch.touchId === this.selectedValue[this.currentlyActiveStage]?.touchId);
    }

    if (restore !== undefined) {
      this.selectedIdx = this.interactions.indexOf(restore);
      this.selectedValue[this.currentlyActiveStage] = restore;
    } else {
      this.selectedValue[this.currentlyActiveStage] = this.interactions[0];
      this.selectedIdx = 0;
    }

    // auto save point with highest confidence if point with this touch id is not already used for calibration
    if (this.selectedValue[this.currentlyActiveStage].confidence >= this.maxConfidence
      && this.calibratedTargets.filter((elem) => elem.touchId === this.selectedValue[this.currentlyActiveStage]?.touchId).length === 0) {
      this.submit();
    }
  }

  private setBorders(borderValues: FrameSizeDefinition): void {
    this.borderOffset = [
      borderValues.top,
      borderValues.left,
      borderValues.top + borderValues.height,
      borderValues.left + borderValues.width
    ];
  }

  private updateSourceValues(): void {
    this.calibrationService.getCalibrationSourcePoints().subscribe((result) => {
      this.calibrationSource = result;
    }, (error: unknown) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  private updateTargetPoints(): void {
    this.calibrationService.getCurrentCalibrationTargetPoints().subscribe((result) => {
      this.calibratedTargets = result;
    }, (error: unknown) => {
      this.logService.sendErrorLog(`${error}`);
      console.error(error);
    });
  }

  private updateBorders(borderValues: FrameSizeDefinition): void {
    this.setBorders(borderValues);
    this.updateSourceValues();
  }

  private handleUpdatedCalibration(result: HttpResponse<CalibrationTransform>): void {
    const trans = result.body as CalibrationTransform;
    if (trans !== undefined) {
      this.calibrationMatrix = trans.transformation;
      if (this.currentlyActiveStage < 2 && this.currentlyActiveStage >= 0) {
        this.currentlyActiveStage += 1;
        this.selectedValue[this.currentlyActiveStage] = this.getDefaultInteraction();
      } else {
        this.currentlyActiveStage = -1;
        this.selectedValue = this.getDefaultSelectedValues();
      }
    } else {
      this.resetTarget(this.currentlyActiveStage);
    }
  }

  private updateCalibrationValues(calibration: Calibration): void {
    this.currentCalibration = calibration;
  }

  private resetTarget(idx: number): void {
    this.calibratedTargets[idx] = { positionX: 0, positionY: 0, touchId: -1 };
  }
}
