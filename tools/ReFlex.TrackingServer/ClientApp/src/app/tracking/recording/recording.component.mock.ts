import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RecordingComponent } from './recording.component';

@Component({
  selector: 'app-recording',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockRecordingComponent implements Partial<RecordingComponent> {
  @Input()
  public recordingName = 'default';
}
