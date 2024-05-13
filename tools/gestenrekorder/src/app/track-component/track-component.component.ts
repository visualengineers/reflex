import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-track-component',
  standalone: true,
  imports: [NgFor],
  templateUrl: './track-component.component.html',
  styleUrl: './track-component.component.scss'
})
export class TrackComponentComponent {
  tracks = [
    { name: "Finger 1", id: 1, length: "30", speed: "0.25" },
    { name: "Finger 2", id: 2, length: "15", speed: "1" },
    { name: "Finger 3", id: 3, length: "45", speed: "2" }
  ];
}
