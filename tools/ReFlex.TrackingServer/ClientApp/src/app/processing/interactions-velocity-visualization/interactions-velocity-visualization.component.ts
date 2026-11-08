import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { InteractionVelocity, Point3 } from '@reflex/shared-types';

@Component({
  selector: 'app-interactions-velocity-visualization',
  imports: [CommonModule],
  templateUrl: './interactions-velocity-visualization.component.html',
  styleUrl: './interactions-velocity-visualization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractionsVelocityVisualizationComponent implements OnChanges {
  @Input() public data: Array<InteractionVelocity> = [];
  @Input() public showLinear = true;
  @Input() public showAccelerated = true;
  @Input() public showMatching = true;
  @Input() public width = 500;
  @Input() public height = 400;
  public trails = new Map<number, Array<Point3>>();
  private readonly lastFrames = new Map<number, number>();

  public get viewBox(): string {
    return `0 0 ${this.width} ${this.height}`;
  }

  public get displayData(): Array<InteractionVelocity> {
    return this.data.map((item) => ({
      ...item,
      measuredPosition: this.scale(item.measuredPosition),
      smoothedPosition: this.scale(item.smoothedPosition),
      matchingPosition: this.scale(item.matchingPosition),
      predictedPositionBasic: this.scale(item.predictedPositionBasic),
      predictedPositionAdvanced: this.scale(item.predictedPositionAdvanced)
    }));
  }

  public ngOnChanges(): void {
    const active = new Set(this.data.map((item) => item.touchId));
    for (const id of this.trails.keys()) {
      if (!active.has(id)) {
        this.trails.delete(id);
        this.lastFrames.delete(id);
      }
    }
    for (const item of this.data) {
      const last = this.lastFrames.get(item.touchId);
      if (last !== undefined && item.frameId < last) {
        this.trails.delete(item.touchId);
      }
      if (!item.isPredicted && last !== item.lastMeasuredFrameId) {
        const points = this.trails.get(item.touchId) ?? [];
        this.trails.set(item.touchId, [...points, { ...item.measuredPosition }].slice(-20));
        this.lastFrames.set(item.touchId, item.lastMeasuredFrameId);
      }
    }
  }

  public path(id: number): string {
    return (this.trails.get(id) ?? []).map((point) => this.scale(point)).map((point) => `${point.x},${point.y}`).join(' ');
  }

  private scale(point: Point3): Point3 {
    return { ...point, x: point.x * this.width, y: point.y * this.height };
  }
}
