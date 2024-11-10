import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Interaction, InteractionData, InteractionVelocity, Point3 } from '@reflex/shared-types';
import { combineLatest, map, NEVER, Observable, startWith, Subscription, switchMap } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';

@Component({
  selector: 'app-interactions-velocity-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interactions-velocity-visualization.component.html',
  styleUrl: './interactions-velocity-visualization.component.scss'
})
export class InteractionsVelocityVisualizationComponent {
  @ViewChild('velocityVis')
  public container?: ElementRef;

  @Input()
  public data: Array<InteractionData> = [];

  private readonly subscriptions = new Subscription();

  public constructor(private readonly processingService: ProcessingService, private readonly logService: LogService) { }

  public mapVelocities(interactions: Array<Interaction>, velocities: Array<InteractionVelocity>): Array<InteractionData> {
    const result: Array<InteractionData> = [];

    interactions.forEach((i) => {
      const associatedVelocity = velocities.find((v) => v.touchId === i.touchId);
      if (associatedVelocity) {
        result.push({ interaction: i, velocity: associatedVelocity });
      }

    });

    return result;
  }

  public updateVelocities(data: Array<InteractionData>): void {
    const copy = JSON.parse(JSON.stringify(data)) as Array<InteractionData>;
    copy.forEach((elem) => {
      elem.interaction.position = this.convertCoordinates(elem.interaction.position);
      elem.velocity.firstDerivation = this.convertCoordinates(elem.velocity.firstDerivation);
      elem.velocity.secondDerivation = this.convertCoordinates(elem.velocity.secondDerivation);
      elem.velocity.predictedPositionBasic = this.convertCoordinates(elem.velocity.predictedPositionBasic);
      elem.velocity.predictedPositionAdvanced = this.convertCoordinates(elem.velocity.predictedPositionAdvanced);
    });

    this.data = copy;
  }

  private convertCoordinates(originalPoint: Point3): Point3 {
    if (!this.container) {
      return originalPoint;
    }

    return {
      x: originalPoint.x * (((this.container.nativeElement) as HTMLElement).clientWidth ?? 0),
      y: originalPoint.y * (((this.container.nativeElement) as HTMLElement).clientHeight ?? 0),
      z: originalPoint.z,
      isFiltered: originalPoint.isFiltered,
      isValid: originalPoint.isFiltered
    };
  }
}
