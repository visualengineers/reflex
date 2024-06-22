import { Component, Input } from '@angular/core';
import { NormalizedPoint } from '../model/NormalizedPoint.model';
import { CommonModule } from '@angular/common';
import { SettingsGroupComponent, ValueSelectionComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hover-menu',
  standalone: true,
  imports: [CommonModule, SettingsGroupComponent, ValueSelectionComponent, ValueTextComponent, FormsModule],
  templateUrl: './hover-menu.component.html',
  styleUrls: ['./hover-menu.component.scss']
})
export class HoverMenuComponent {
  @Input() hoveredPoint: NormalizedPoint | null = null;

  getX(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.x === 'number'
      ? this.hoveredPoint.x.toFixed(2)
      : 'N/A';
  }

  getY(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.y === 'number'
      ? this.hoveredPoint.y.toFixed(2)
      : 'N/A';
  }

  getZ(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.z === 'number'
      ? this.hoveredPoint.z.toFixed(2)
      : 'N/A';
  }

  getTime(): string {
    return this.hoveredPoint && this.hoveredPoint.time
      ? new Date(this.hoveredPoint.time).toISOString()
      : 'N/A';
  }

  getIndex(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.index === 'number'
      ? this.hoveredPoint.index.toString()
      : 'N/A';
  }
}
