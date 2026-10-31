import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Interaction } from '@reflex/shared-types';
import { interval, Observable, Subscription } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {

  public touchPoints$: Observable<Array<Interaction>> | undefined;
  public touchPointSubscription: Subscription | undefined;

  public connectionSubscription: Subscription | undefined;

  public webSocketAddress = '';
  public isConnected = false;
  public frameNumber = 0;
  public touchCount = 0;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly pointService = inject(TouchPointService);
  private frameSubscription?: Subscription;

  public ngOnInit(): void {
    this.touchPoints$ = this.pointService.getTouchPoints();
    this.touchPointSubscription = this.touchPoints$.subscribe((res) => {
      this.changeDetector.markForCheck();
      this.touchCount = res.length;
    });
    this.connectionSubscription = interval(500).subscribe(() => {
      this.isConnected = this.pointService.isConnected();
      this.changeDetector.markForCheck();
    });
    console.log(this.isConnected);
    this.webSocketAddress = this.pointService.getAddress();
    this.frameSubscription = this.pointService
      .getFrameNumber()
      .subscribe((n) => {
        this.frameNumber = n;
        this.changeDetector.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.touchPointSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.frameSubscription?.unsubscribe();
  }
}
