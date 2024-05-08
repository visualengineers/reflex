import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-panel-header',
  standalone: true,
  templateUrl: './panel-header.component.html',
  imports: [CommonModule, FormsModule]
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

  public update(): void {
    this.dataChange.emit(this.data);
    this.onChange.emit();
  }

}
