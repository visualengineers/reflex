import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-panel-header',
  templateUrl: './panel-header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
})
export class PanelHeaderComponent {
  @Input()
  public disabled = false;

  @Input()
  public data = false;

  @Output()
  public dataChange = new EventEmitter<boolean>();

  @Input()
  public elementId = 'custom-header';

  @Input()
  public elementTitle = 'Custom Title';

  @Output()
  public onChange = new EventEmitter();

  public update(value: boolean): void {
    this.data = value;
    this.dataChange.emit(this.data);
    this.onChange.emit();
  }
}
