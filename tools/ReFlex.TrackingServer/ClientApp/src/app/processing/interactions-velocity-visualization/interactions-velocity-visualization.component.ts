import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InteractionVelocity, Point3 } from '@reflex/shared-types';

@Component({
  selector: 'app-interactions-velocity-visualization',
  imports: [CommonModule, FormsModule],
  templateUrl: './interactions-velocity-visualization.component.html',
  styleUrl: './interactions-velocity-visualization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractionsVelocityVisualizationComponent implements OnChanges {
  @Input() public data: Array<InteractionVelocity> = [];
  public showLinear = true;
  public showAccelerated = true;
  public showMatching = true;
  public trails = new Map<number, Array<Point3>>();
  private readonly lastFrames = new Map<number, number>();

  public get viewBox(): string {
    return `0 0 ${Math.max(1, this.data[0]?.width || 640)} ${Math.max(1, this.data[0]?.height || 480)}`;
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
    return (this.trails.get(id) ?? []).map((point) => `${point.x},${point.y}`).join(' ');
  }
}
