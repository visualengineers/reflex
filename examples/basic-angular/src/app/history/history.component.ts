import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { InteractionFrame } from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {

  public frames: Array<InteractionFrame> = [];
  public JSON: JSON;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly pointService = inject(TouchPointService);

  private frameSubscription: Subscription | undefined;

  public constructor() {
    this.JSON = JSON;
  }

  public ngOnInit(): void {
    this.frameSubscription = this.pointService.getHistory().subscribe((res) => {
      this.changeDetector.markForCheck();
      this.frames = res;
    });
  }

  public ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    this.frameSubscription?.unsubscribe();
  }
}
