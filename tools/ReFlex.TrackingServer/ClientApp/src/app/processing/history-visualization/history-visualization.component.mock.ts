import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HistoryVisualizationComponent } from './history-visualization.component';

@Component({
  selector: 'app-history-visualization',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockHistoryVisualizationComponent
implements Partial<HistoryVisualizationComponent> {
}
