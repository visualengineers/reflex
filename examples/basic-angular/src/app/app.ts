import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Interaction } from '@reflex/shared-types';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import { HistoryComponent } from './history/history.component';
import { StatusComponent } from './status/status.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    imports: [
      RouterOutlet,
      StatusComponent,
      HistoryComponent,
      CommonModule
    ],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrls: ['./app.scss']
})
export class App implements AfterViewInit, OnInit, OnDestroy {
  title = 'Basic Angular App';

  public TouchPoints$ : Observable<Interaction[]>;
  public Width = 0;
  public Height = 0;
  public Math = Math;

  resizeObservable$: Observable<Event> | undefined
  resizeSubscription$: Subscription | undefined;

  @ViewChild('interactionCanvas')
  interactionCanvas: ElementRef | undefined;


  constructor(private _pointService : TouchPointService) {
    this.TouchPoints$ = this._pointService.getTouchPoints();
  }

  ngOnInit() {
    this.resizeObservable$ = fromEvent(window, 'resize')
    this.resizeSubscription$ = this.resizeObservable$.subscribe( evt => {
      this.updateSize();
    })
  }

  ngOnDestroy() {
    if (this.resizeSubscription$) {
      this.resizeSubscription$?.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.updateSize();
  }

  private updateSize() {
    if (this.interactionCanvas) {
      this.Width = this.interactionCanvas.nativeElement.offsetWidth;
      this.Height = this.interactionCanvas.nativeElement.offsetHeight;
    }
  }
}
