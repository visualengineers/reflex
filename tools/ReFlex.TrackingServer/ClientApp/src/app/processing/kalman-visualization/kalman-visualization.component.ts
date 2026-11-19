import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { InteractionVelocity, Point3 } from '@reflex/shared-types';

interface Trail {
  measurements: Array<Point3>;
  estimates: Array<Point3>;
  lastMeasuredFrame: number;
  frame: number;
}
interface KalmanSample extends InteractionVelocity {
  kalmanPosition: Point3;
}

@Component({
  selector: 'app-kalman-visualization',
  templateUrl: './kalman-visualization.component.html',
  styleUrl: './kalman-visualization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KalmanVisualizationComponent implements OnChanges {
  @Input() public data: Array<InteractionVelocity> = [];
  @Input() public width = 500;
  @Input() public height = 400;
  public trails = new Map<number, Trail>();

  public get displayData(): Array<KalmanSample> {
    return this.data.filter((item): item is KalmanSample => item.useKalmanFilter === true && item.kalmanPosition != null);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] === undefined) {
      return;
    }
    const active = new Set(this.displayData.map((item) => item.touchId));
    for (const id of this.trails.keys()) {
      if (!active.has(id)) {
        this.trails.delete(id);
      }
    }
    for (const item of this.displayData) {
      let trail = this.trails.get(item.touchId);
      if (trail === undefined || item.frameId < trail.frame) {
        trail = { measurements: [], estimates: [], lastMeasuredFrame: -1, frame: item.frameId };
        this.trails.set(item.touchId, trail);
      }
      if (!item.isPredicted && item.lastMeasuredFrameId !== trail.lastMeasuredFrame) {
        trail.measurements = [...trail.measurements, { ...item.measuredPosition }].slice(-60);
        trail.estimates = [...trail.estimates, { ...item.kalmanPosition }].slice(-60);
        trail.lastMeasuredFrame = item.lastMeasuredFrameId;
      }
      trail.frame = item.frameId;
    }
  }

  public x(point: Point3): number {
    return point.x * this.width;
  }

  public y(point: Point3): number {
    return point.y * this.height;
  }

  public path(points: Array<Point3>): string {
    return points.map((point) => `${this.x(point)},${this.y(point)}`).join(' ');
  }
}
