import { Component } from '@angular/core';
import { HistoryVisualizationComponent } from './history-visualization.component';


@Component({
    selector: 'app-history-visualization', template: '',
    standalone: false
})
export class MockHistoryVisualizationComponent implements Partial<HistoryVisualizationComponent> {

  public constructor() { } 

}