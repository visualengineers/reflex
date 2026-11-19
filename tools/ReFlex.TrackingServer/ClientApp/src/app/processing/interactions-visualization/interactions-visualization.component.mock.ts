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
  @Input() public showMatching = true;
  @Input() public showLinear = true;
  @Input() public showAccelerated = true;

  public get eventId(): number {
    return 0;
  }

  @Input()
  public set eventId(value: number) {}
}
