import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MeasureControlsComponent } from './measure-controls.component';

@Component({
  selector: 'app-measure-controls',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockMeasureControlsComponent
  implements Partial<MeasureControlsComponent> {}
