import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ColorItemComponent } from './color-item/color-item.component';

@Component({
  selector: 'app-color',
  imports: [ColorItemComponent],
  templateUrl: './color.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './color.component.scss'
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ColorComponent {}
