import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CompleteInteractionData, ElementPosition, ExtremumDescription, ExtremumType, FrameSizeDefinition, Interaction } from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { InteractionsVelocityVisualizationComponent } from '../interactions-velocity-visualization/interactions-velocity-visualization.component';
import { HistoryVisualizationComponent } from '../history-visualization/history-visualization.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interactions-visualization',
  templateUrl: './interactions-visualization.component.html',
  styleUrls: ['./interactions-visualization.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    InteractionsVelocityVisualizationComponent,
    HistoryVisualizationComponent
  ]
})
export class InteractionsVisualizationComponent implements OnInit, OnDestroy {

  @ViewChild('interactionVis')
  public container?: ElementRef;

  @ViewChild('velocityVis')
  public velocity?: InteractionsVelocityVisualizationComponent;

  public interactions: CompleteInteractionData = { raw: [], absolute: [], normalized: [] };
  public calibratedInteractions: Array<Interaction> = [];

  public fullScreen = false;
  public maxConfidence = 30;

  private frameSizeSubscription?: Subscription;
  private frameSize: FrameSizeDefinition = { top: 0, left: 0, width: 500, height: 400 };
  private pEventId = 0;

  public constructor(private readonly calibrationService: CalibrationService, private readonly logService: LogService) { }

  public get eventId(): number {
    return this.pEventId;
  }

  @Input()
  public set eventId(value: number) {
    this.pEventId = value;
  }

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

    this.calibratedInteractions = this.fullScreen ? result.absolute : result.normalized;

    if (this.container === undefined) {
      return;
    }

    const copy = JSON.parse(JSON.stringify(this.calibratedInteractions)) as Array<Interaction>;

    copy.forEach((int) => {
      int.position.x = this.fullScreen ? int.position.x - this.frameSize.left : int.position.x * ((this.container?.nativeElement as HTMLElement | undefined)?.clientWidth ?? 0);
      int.position.y = this.fullScreen ? int.position.y - this.frameSize.top : int.position.y * ((this.container?.nativeElement as HTMLElement | undefined)?.clientHeight ?? 0);

      int.position.z = Math.abs(int.position.z) * 2;
    });

    this.calibratedInteractions = copy;
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
