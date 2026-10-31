import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TouchPointService } from 'src/services/touch-point.service';
import { InteractionFrame } from '@reflex/shared-types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private _pointService = inject(TouchPointService);

  private _frames: Subscription | undefined;

  public Frames: Array<InteractionFrame> = [];
  public JSON: JSON;

  constructor() {
    this.JSON = JSON;
  }

  ngOnInit(): void {
    this._frames = this._pointService.getHistory().subscribe((res) => {
      this.changeDetector.markForCheck();
      this.Frames = res;
    });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this._frames?.unsubscribe();
  }
}
