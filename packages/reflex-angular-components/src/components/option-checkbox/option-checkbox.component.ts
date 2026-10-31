import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-option-checkbox',
  templateUrl: './option-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
})
export class OptionCheckboxComponent {
  @Input()
  public disabled = false;

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

  public onModelChange(value: boolean): void {
    this.data = value;
    this.dataChange.emit(this.data);
    this.onChange.emit();
  }
}
