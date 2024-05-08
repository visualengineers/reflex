import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-color-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-item.component.html',
  styleUrl: './color-item.component.scss'
})
export class ColorItemComponent {
  @Input()
  public ColorName: string = 'defaultColor';

  @Input()
  public ColorText: string = '#123456, Alpha 100%';

  @Input()
  public ColorClass: string = 'color-primary';
}
