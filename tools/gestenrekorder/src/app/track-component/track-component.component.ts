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
    { name: "Track 1", id: 1, length: "10m", speed: "50km/h" },
    { name: "Track 2", id: 2, length: "15m", speed: "60km/h" },
    { name: "Track 3", id: 3, length: "20m", speed: "70km/h" }
  ];
}
