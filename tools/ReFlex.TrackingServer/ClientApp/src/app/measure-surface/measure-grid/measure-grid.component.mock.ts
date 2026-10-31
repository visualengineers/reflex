/* eslint-disable @typescript-eslint/no-extraneous-class */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MeasureGridComponent } from './measure-grid.component';

@Component({
  selector: 'app-measure-grid',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockMeasureGridComponent
  implements Partial<MeasureGridComponent> {}
