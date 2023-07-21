import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-option-checkbox',
  templateUrl: './option-checkbox.component.html'
})
export class OptionCheckboxComponent {

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

  public onModelChange(): void {
    this.dataChange.emit(this.data);
    this.onChange.emit();
  }
}
