import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-color-item',
    imports: [CommonModule],
    templateUrl: './color-item.component.html',
    styleUrl: './color-item.component.scss'
})
export class ColorItemComponent {
  @Input()
  public colorName = 'defaultColor';

  @Input()
  public colorText = '#123456, Alpha 100%';

  @Input()
  public colorClass = 'color-primary';
}
