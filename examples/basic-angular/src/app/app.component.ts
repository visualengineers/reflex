import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import { TouchPoint } from 'src/shared/touch-point';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'Basic Angular App';

  public TouchPoints$ : Observable<TouchPoint[]>;
  public Width = 0;
  public Height = 0;

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