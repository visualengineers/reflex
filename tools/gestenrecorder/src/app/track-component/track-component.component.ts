import { Component } from '@angular/core';
import { SettingsGroupComponent } from '@reflex/angular-components/dist'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnInit, OnDestroy } from '@angular/core';
import { GestureDataService } from '../service/gesture-data.service';
import { Subscription } from 'rxjs';
import { Gesture } from '../data/gesture';
import { GestureReplayService } from '../service/gesture-replay.service';

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
export class TrackComponentComponent implements OnInit, OnDestroy{
  public selectedIndex: number = -1;
  selectedGesture: Gesture | null = null;
  private gestureSubscription: Subscription = new Subscription();

  public tableData: Array<GestureData> = [
    {
      id: 1,
      name: 'Finger 1',
      numFrames: 30,
      speed: 1
    }
  ];

  constructor(
    private gestureService: GestureDataService,
    private gestureReplayService: GestureReplayService,
  ) {}

  ngOnInit() {
    this.gestureSubscription = this.gestureService.gesture$.subscribe(gesture => {
      this.selectedGesture = gesture;

      // Aktualisiere tableData, wenn selectedGesture aktualisiert wird
      if (this.selectedGesture) {
        this.tableData = [{
          id: this.selectedGesture.id,
          name: this.selectedGesture.name,
          numFrames: this.selectedGesture.numFrames,
          speed: this.selectedGesture.speed
        }];
      }
    });
  }

  ngOnDestroy(): void {
      this.gestureSubscription.unsubscribe();
  }

  public saveTrack(): void {
    const newId = this.tableData.length + 1;
    const newGestureData: GestureData = {
      id: newId,
      name: `Finger ${newId}`,
      numFrames: 30,
      speed: 1
    };

    this.tableData.push(newGestureData);
    console.log("new table data:",this.tableData);
    this.updateGesture();
  }

  public addTrack(): void {

  }

  public deleteTrack(index: number): void {
    if (this.selectedIndex !== index) {
      return;
    }

    this.tableData.splice(index, 1);
    this.selectedIndex = -1;
    this.updateGesture();
  }

  updateGesture(): void {
    if ( this.selectedIndex === -1 ) {
      return ;
    }

    const selectedRow = this.tableData[this.selectedIndex];
    this.gestureService.updateGesture(selectedRow.id, selectedRow.name, selectedRow.numFrames, selectedRow.speed);
  }
}
