import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuioComponent } from './tuio.component';

@Component({
  selector: 'app-tuio',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockTuioComponent implements Partial<TuioComponent> {}
