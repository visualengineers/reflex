import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValueSelectionComponent } from '@reflex/angular-components/dist';
import { GestureDataService } from '../service/gesture-data.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-savingoptions',
  imports: [ValueSelectionComponent, FormsModule],
  templateUrl: './savingoptions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './savingoptions.component.scss'
})
export class SavingoptionsComponent implements OnInit {

  public gestureFileNames: Array<string> = [];
  public selectedGestureFile = '';
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly gestureDataService = inject(GestureDataService);

  public ngOnInit(): void {
    this.gestureDataService
      .getGestureFileNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fileNames) => {
          this.gestureFileNames = fileNames;
          this.changeDetector.markForCheck();
        },
        error: (error) =>
          console.error('Error loading gesture file names:', error)
      });
  }

  public loadSelectedGesture(): void {
    if (this.selectedGestureFile) {
      const filePath = `assets/data/${this.selectedGestureFile}`;
      this.gestureDataService.loadGestureFromFile(filePath);
    }
  }

  public saveCreatedGesture(): void {
    this.gestureDataService.saveGestureToJson();
  }
}
