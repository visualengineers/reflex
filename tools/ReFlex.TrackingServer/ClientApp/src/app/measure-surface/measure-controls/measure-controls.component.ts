import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, timer } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { LogService } from 'src/app/log/log.service';
import { MeasureService } from 'src/shared/services/measure.service';

@Component({
  selector: 'app-measure-controls',
  templateUrl: './measure-controls.component.html',
  styleUrls: ['./measure-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
})
export class MeasureControlsComponent implements OnInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly measureService = inject(MeasureService);
  private readonly logService = inject(LogService);

  public captureId = 0;

  public numFramesCaptured = 0;

  public isCapturing = false;

  private captureState?: Subscription;

  public ngOnInit(): void {
    const isCapturing$ = this.measureService.isCapturing();
    const sampleIdx$ = this.measureService.getCurrentSampleIdx();
    this.captureState = timer(0, 500)
      .pipe(
        concatMap(() => isCapturing$),
        map((result) => {
          this.isCapturing = result;
          this.changeDetector.markForCheck();
          console.log(this.isCapturing);
        }),
        concatMap(() => sampleIdx$),
        map((result) => {
          this.numFramesCaptured = result;
        }),
        catchError((error: unknown, caught: Observable<void>) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);

          return caught;
        })
      )
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.captureState?.unsubscribe();
  }

  public captureFrames(): void {
    this.measureService
      .startCapture(this.captureId)
      .pipe(markViewForCheck(this.changeDetector))
      .subscribe(
        (result) => console.info(result),
        (error: unknown) => {
          console.error(error);
          this.logService.sendErrorLog(`${error}`);
        }
      );
  }
}
