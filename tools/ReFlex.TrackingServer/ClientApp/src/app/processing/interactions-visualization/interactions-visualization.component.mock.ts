import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { InteractionsVisualizationComponent } from './interactions-visualization.component';

@Component({
  selector: 'app-interactions-visualization',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockInteractionsVisualizationComponent
implements Partial<InteractionsVisualizationComponent> {
  @Output() public predictionDataChange = new EventEmitter();
  @Input() public isProcessing = false;
  @Input() public showPrediction = true;
  @Input() public predictionEnabled = true;
  @Input() public kalmanEnabled = false;
  @Input() public accelerationEnabled = false;
  @Output() public showPredictionChange = new EventEmitter<boolean>();
  @Input() public showMatching = true;
  @Input() public showLinear = true;
  @Input() public showAccelerated = true;
  @Output() public showMatchingChange = new EventEmitter<boolean>();
  @Output() public showLinearChange = new EventEmitter<boolean>();
  @Output() public showAcceleratedChange = new EventEmitter<boolean>();

  public get eventId(): number {
    return 0;
  }

  @Input()
  public set eventId(value: number) {}
}
