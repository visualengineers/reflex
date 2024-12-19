import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OptionCheckboxComponent } from './option-checkbox.component';

@Component({
    selector: 'app-option-checkbox', template: '',
    standalone: false
})
export class MockOptionCheckboxComponent implements Partial<OptionCheckboxComponent>{

  @Input()
  public data = false;

  @Output()
  public dataChange = new EventEmitter<boolean>();

  @Input()
  public elementId = 'custom-checkbox';

  @Input()
  public elementTitle = 'Custom Value';

  @Output()
  public onChange = new EventEmitter();
}