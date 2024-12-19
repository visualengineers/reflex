import { Component } from '@angular/core';
import { HistoryComponent } from './history.component';

@Component({
    selector: 'app-history', template: '',
    standalone: false
})
export class MockHistoryComponent implements Partial<HistoryComponent> {

  public constructor() { }
}
