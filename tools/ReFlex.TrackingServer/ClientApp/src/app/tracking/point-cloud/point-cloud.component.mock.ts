import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { PointCloudComponent } from './point-cloud.component';

@Component({
  selector: 'app-point-cloud',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockPointCloudComponent implements Partial<PointCloudComponent> {
  @Input()
  public width = 800;

  @Output()
  public fullScreenChanged = new EventEmitter<boolean>();

  @Input()
  public livePreviewEnabled = false;
}
