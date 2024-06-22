import { Component, Input } from '@angular/core';
import { NormalizedPoint } from '../model/NormalizedPoint.model';

@Component({
  selector: 'app-hover-menu',
  standalone: true,
  imports: [],
  templateUrl: './hover-menu.component.html',
  styleUrl: './hover-menu.component.scss'
})
export class HoverMenuComponent {
  @Input() hoveredPoint: NormalizedPoint | null = null;

  constructor() { }
}
