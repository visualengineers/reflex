import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GestureDataService } from '../service/gesture-data.service';
import { Gesture } from '../data/gesture';
import { OnInit } from '@angular/core';
import { ValueSelectionComponent } from '@reflex/angular-components/dist';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-savingoptions',
  imports: [ValueSelectionComponent, FormsModule],
  templateUrl: './savingoptions.component.html',
  styleUrl: './savingoptions.component.scss',
})
export class SavingoptionsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private gestureDataService = inject(GestureDataService);

  gestureFileNames: string[] = [];
  selectedGestureFile: string = '';

  ngOnInit(): void {
    this.gestureDataService.getGestureFileNames().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (fileNames) => {
        this.gestureFileNames = fileNames;
        this.changeDetector.markForCheck();
      },
      error: (error) => console.error('Error loading gesture file names:', error),
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
