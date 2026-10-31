
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MeasureGridComponent } from './measure-grid.component';

@Component({
  selector: 'app-measure-grid',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockMeasureGridComponent
implements Partial<MeasureGridComponent> {}
