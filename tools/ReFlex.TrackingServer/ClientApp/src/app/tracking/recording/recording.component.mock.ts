import { Component, OnInit, Input } from "@angular/core";
import { RecordingComponent } from "./recording.component";

@Component({ selector: 'app-recording', template: '' })
export class MockRecordingComponent implements Partial<RecordingComponent> {

  @Input()
  public recordingName = 'default';
}
  