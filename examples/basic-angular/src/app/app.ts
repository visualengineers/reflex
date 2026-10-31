import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Interaction } from '@reflex/shared-types';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import { HistoryComponent } from './history/history.component';
import { StatusComponent } from './status/status.component';

@Component({
  imports: [RouterOutlet, StatusComponent, HistoryComponent, CommonModule],
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.scss']
})
export class App implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild('interactionCanvas')
  public interactionCanvas: ElementRef<HTMLDivElement> | undefined;

  public title = 'Basic Angular App';

  public touchPoints$: Observable<Array<Interaction>>;
  public width = 0;
  public height = 0;
  public math = Math;

  public resizeObservable$: Observable<Event> | undefined;
  public resizeSubscription$: Subscription | undefined;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly pointService = inject(TouchPointService);

  public constructor() {
    this.touchPoints$ = this.pointService.getTouchPoints();
  }

  public ngOnInit(): void {
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe(() => {
      this.updateSize();
    });
  }

  public ngOnDestroy(): void {
    if (this.resizeSubscription$) {
      this.resizeSubscription$?.unsubscribe();
    }
  }

  public ngAfterViewInit(): void {
    // Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    // Add 'implements AfterViewInit' to the class.
    this.updateSize();
  }

  private updateSize(): void {
    this.changeDetector.markForCheck();
    if (this.interactionCanvas) {
      this.width = this.interactionCanvas.nativeElement.offsetWidth;
      this.height = this.interactionCanvas.nativeElement.offsetHeight;
    }
  }
}
