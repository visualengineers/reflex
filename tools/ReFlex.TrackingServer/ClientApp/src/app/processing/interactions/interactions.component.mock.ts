import { Component, Input } from '@angular/core';
import { InteractionsComponent } from './interactions.component';
@Component({
  selector: 'app-interactions',
  template: ''
})
export class MockInteractionsComponent implements Partial<InteractionsComponent> {

  public get isProcessing(): boolean {
    return true;
  }

  @Input()
  public set isProcessing(value: boolean) { }
}
