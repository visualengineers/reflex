
import { Component } from '@angular/core';
import { GestureDataService } from '../service/gesture-data.service';
import { Gesture } from '../data/gesture';
import { OnInit } from '@angular/core';
import { ValueSelectionComponent } from '@reflex/angular-components/dist';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-savingoptions',
    imports: [ValueSelectionComponent, CommonModule, FormsModule],
    templateUrl: './savingoptions.component.html',
    styleUrl: './savingoptions.component.scss'
})
export class SavingoptionsComponent implements OnInit {
  gestureFileNames: string[] = [];
  selectedGestureFile: string = '';

  constructor (private gestureDataService: GestureDataService) {}

  ngOnInit(): void {
    this.gestureDataService.getGestureFileNames().subscribe({
      next: (fileNames) => this.gestureFileNames = fileNames,
      error: (error) => console.error('Error loading gesture file names:', error)
    });
  }

  loadSelectedGesture(): void {
    if (this.selectedGestureFile) {
      const filePath = `assets/data/${this.selectedGestureFile}`;
      this.gestureDataService.loadGestureFromFile(filePath);
    }
  }

  saveCreatedGesture(): void {
    this.gestureDataService.saveGestureToJson();
  }
}
