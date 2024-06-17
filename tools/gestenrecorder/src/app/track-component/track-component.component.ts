import { Component } from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist'
import { CommonModule } from '@angular/common';

export interface GestureData {
  id: number;
  name: string;
  numFrames: number;
  speed: number;
}

@Component({
  selector: 'app-track-component',
  standalone: true,
  imports: [
    CommonModule,
    SettingsGroupComponent
  ],
  templateUrl: './track-component.component.html',
  styleUrl: './track-component.component.scss'
})
export class TrackComponentComponent {
  public tableData: Array<GestureData> = [
    {
      id: 1,
      name: 'Finger 1',
      numFrames: 30,
      speed: 1 },
    {
      id: 2,
      name: 'Finger 2',
      numFrames: 40,
      speed: 0.75
    },
    {
      id: 3,
      name: 'Finger 3',
      numFrames: 25,
      speed: 2
    }
  ];
}
