import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HistoryComponent } from './history.component';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockHistoryComponent implements Partial<HistoryComponent> {
}
