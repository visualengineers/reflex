import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CompleteInteractionData, ElementPosition, ExtremumDescription, ExtremumType, FrameSizeDefinition, Interaction } from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { CalibrationService } from 'src/shared/services/calibration.service';

@Component({
  selector: 'app-interactions-visualization',
  templateUrl: './interactions-visualization.component.html',
  styleUrls: ['./interactions-visualization.component.scss']
})
export class InteractionsVisualizationComponent implements OnInit, OnDestroy {

  @ViewChild('interactionVis')
  public container?: ElementRef;

  public interactions: CompleteInteractionData = { raw: [], absolute: [], normalized: [] };
  public calibratedInteractions: Array<Interaction> = [];

  public fullScreen = false;
  public maxConfidence = 30;

  private frameSizeSubscription?: Subscription;
  private _frameSize: FrameSizeDefinition = { top: 0, left: 0, width: 500, height: 400 };
  private _eventId = 0;

  public constructor(private readonly calibrationService: CalibrationService, private readonly logService: LogService) { }

  public get eventId(): number {
    return this._eventId;
  }

  @Input()
  public set eventId(value: number) {
    this._eventId = value;
  }

  public ngOnInit(): void {
    this.frameSizeSubscription = this.calibrationService.getFrameSize().subscribe((result) => {
      this._frameSize = result;
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public ngOnDestroy(): void {
    this.frameSizeSubscription?.unsubscribe();
  }

  public getInteractionsViewStyle(): ElementPosition {
    if (this.fullScreen) {
      return {
        position: 'absolute',
        top: `${this._frameSize.top}px`,
        left: `${this._frameSize.left}px`,
        width: `${this._frameSize.width}px`,
        height: `${this._frameSize.height}px`
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

    this.calibratedInteractions = this.fullScreen ? result.absolute : result.normalized;

    if (this.container === undefined) {
      return;
    }

    this.calibratedInteractions.forEach((int) => {
      int.position.x = this.fullScreen ? int.position.x - this._frameSize.left : int.position.x * this.container?.nativeElement.clientWidth ?? 0;
      int.position.y = this.fullScreen ? int.position.y - this._frameSize.top : int.position.y * this.container?.nativeElement.clientHeight ?? 0;
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
