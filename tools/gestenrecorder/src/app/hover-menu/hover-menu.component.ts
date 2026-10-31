import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import { NormalizedPoint } from '../model/NormalizedPoint.model';

import { FormsModule } from '@angular/forms';
import {
  SettingsGroupComponent,
  ValueSelectionComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { ConfigurationService } from '../service/configuration.service';

@Component({
  selector: 'app-hover-menu',
  imports: [
    SettingsGroupComponent,
    ValueSelectionComponent,
    ValueTextComponent,
    FormsModule
  ],
  templateUrl: './hover-menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./hover-menu.component.scss']
})
export class HoverMenuComponent {

  @Input() public hoveredPoint: NormalizedPoint | null = null;
  @Output() public pointUpdated = new EventEmitter<NormalizedPoint>();
  @Input() public isFixed = false;
  private readonly configurationService = inject(ConfigurationService);

  public toggleFixed(): void {
    this.isFixed = !this.isFixed;
  }

  public getX(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.x === 'number'
      ? this.hoveredPoint.x.toFixed(2)
      : 'N/A';
  }

  public getY(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.y === 'number'
      ? this.hoveredPoint.y.toFixed(2)
      : 'N/A';
  }

  public getZ(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.z === 'number'
      ? this.hoveredPoint.z.toFixed(2)
      : 'N/A';
  }

  public getTime(): string {
    return this.hoveredPoint?.time !== undefined
      ? new Date(this.hoveredPoint.time).toISOString()
      : 'N/A';
  }

  public getIndex(): string {
    return this.hoveredPoint && typeof this.hoveredPoint.index === 'number'
      ? this.hoveredPoint.index.toString()
      : 'N/A';
  }

  public updatePoint(): void {
    if (this.hoveredPoint !== null) {
      this.pointUpdated.emit(this.hoveredPoint);
    }
  }
}
