import { Component, Input } from '@angular/core';
import { InteractionsVisualizationComponent } from './interactions-visualization.component';

@Component({
  selector: 'app-interactions-visualization',
  template: ''
})
export class MockInteractionsVisualizationComponent implements Partial<InteractionsVisualizationComponent> {

  public get eventId(): number {
    return 0;
  }

  @Input()
  public set eventId(value: number) {
  }
}
