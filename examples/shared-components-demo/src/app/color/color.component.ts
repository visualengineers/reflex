import { Component } from '@angular/core';
import { ColorItemComponent } from './color-item/color-item.component';

@Component({
  selector: 'app-color',
  standalone: true,
  imports: [ ColorItemComponent ],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss'
})
export class ColorComponent {

}
