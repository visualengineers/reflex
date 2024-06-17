import { Component } from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    SettingsGroupComponent,
    FormsModule
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
      speed: 1
    }
  ];
  public selectedIndex: number = -1;

  public addTrack(): void {
    const newId = this.tableData.length + 1;
    this.tableData.push({
      id: newId,
      name: `Finger ${newId}`,
      numFrames: 30,
      speed: 1
    });
  }

  public deleteTrack(index: number): void {
    if (this.selectedIndex !== index) {
      return;
    }
    this.tableData.splice(index, 1);
    this.selectedIndex = -1;
  }
}
