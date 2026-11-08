import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';
import { InteractionVelocity } from '@reflex/shared-types';

@Component({
  selector: 'app-forecast-values',
  imports: [CommonModule, SettingsGroupComponent],
  templateUrl: './forecast-values.component.html',
  styleUrl: './forecast-values.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForecastValuesComponent {
  @Input() public data: Array<InteractionVelocity> = [];
  public readonly columns = Array.from({ length: 10 });

  public get sortedData(): Array<InteractionVelocity> {
    return [...this.data].sort((a, b) => a.touchId - b.touchId);
  }

  public get emptyRows(): Array<undefined> {
    return Array.from({ length: Math.max(0, 10 - this.data.length) });
  }
}
