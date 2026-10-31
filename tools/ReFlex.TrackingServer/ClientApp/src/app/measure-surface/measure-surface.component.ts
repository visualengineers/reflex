import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElementPosition, FrameSizeDefinition } from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { LogService } from '../log/log.service';
import { MeasureControlsComponent } from './measure-controls/measure-controls.component';
import { MeasureGridComponent } from './measure-grid/measure-grid.component';

@Component({
  selector: 'app-measure-surface',
  templateUrl: './measure-surface.component.html',
  styleUrls: ['./measure-surface.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    MeasureControlsComponent,
    MeasureGridComponent
  ]
})
export class MeasureSurfaceComponent implements OnInit, OnDestroy {

  public fullScreen = false;
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
    this.frameSizeSubscription?.unsubscribe();
  }

  public getViewStyle(): ElementPosition {
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
}
