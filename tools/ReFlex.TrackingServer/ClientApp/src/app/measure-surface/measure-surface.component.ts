import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { LogService } from '../log/log.service';
import { ElementPosition, FrameSizeDefinition } from '@reflex/shared-types';

@Component({
  selector: 'app-measure-surface',
  templateUrl: './measure-surface.component.html',
  styleUrls: ['./measure-surface.component.scss']
})
export class MeasureSurfaceComponent implements OnInit {

  public fullScreen = false;

  private frameSizeSubscription?: Subscription;
  private frameSize: FrameSizeDefinition = { top: 0, left: 0, width: 500, height: 400 };

  public constructor(private readonly calibrationService: CalibrationService, private readonly logService: LogService) { }

  public ngOnInit(): void {
    this.frameSizeSubscription = this.calibrationService.getFrameSize().subscribe((result) => {
      this.frameSize = result;
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
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
