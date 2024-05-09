import { Component } from '@angular/core';
import { ColorItemComponent } from './color-item/color-item.component';

@Component({
  selector: 'app-color',
  standalone: true,
  imports: [ColorItemComponent],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss'
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ColorComponent {

}
