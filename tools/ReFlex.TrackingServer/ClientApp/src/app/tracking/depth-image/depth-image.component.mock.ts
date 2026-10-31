import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { DepthImageComponent } from './depth-image.component';

@Component({
  selector: 'app-depth-image',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockDepthImageComponent implements Partial<DepthImageComponent> {
  @Output()
  public fullScreenChanged = new EventEmitter<boolean>();

  @Input()
  public livePreviewEnabled = false;
}
