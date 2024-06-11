import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { combineLatest, fromEvent, Subscription, race } from 'rxjs';
import { distinctUntilChanged, map, filter, publishBehavior, refCount, switchMap, takeUntil, debounceTime, withLatestFrom, startWith, pairwise } from 'rxjs/operators';
import { ConfigurationService, Layers } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { CircleDto } from '../shapes/Circle';
import { EventService } from './service/event.service';
import { TouchAreaService } from './service/touch-area.service';
import { CircleRenderer } from '../shapes/Circle';
import { GestureDataService } from '../service/gesture-data.service';
import { lstatSync } from 'fs';

interface Size {
  width: number;
  height: number;
}

@Component({
  selector: 'app-touch-area',
  standalone: true,
  templateUrl: './touch-area.component.html',
  styleUrls: ['./touch-area.component.scss']
})
export class TouchAreaComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas?: ElementRef<HTMLCanvasElement>;

  public backgroundPath = '';
  private ctx?: CanvasRenderingContext2D;
  private layers?: Layers;
  private subscriptions: Subscription[] = [];
  private circleRenderer?: CircleRenderer;

  constructor(
    private connectionService: ConnectionService,
    private configurationService: ConfigurationService,
    private eventService: EventService,
    private touchAreaService: TouchAreaService,
    private hostElement: ElementRef,
    private gestureService: GestureDataService,
  ) {}

  ngOnInit(): void {
    if (this.canvas?.nativeElement !== undefined) {
      this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    this.circleRenderer = new CircleRenderer(this.ctx, this.configurationService);

    const windowSize$ = fromEvent(window, 'resize').pipe(
      map(() => ({ width: window.innerWidth, height: window.innerHeight } as Size)),
      distinctUntilChanged((a, b) => a.width === b.width && a.height === b.height),
      debounceTime(100),
      publishBehavior({ width: window.innerWidth, height: window.innerHeight } as Size),
      refCount()
    );

    const amountTouchPoints$ = this.configurationService.getAmountTouchPoints();
    const layers$ = this.configurationService.getLayers();

    if (this.canvas?.nativeElement === undefined) {
      return;
    }

    const { mouseDown$, mouseMove$, mouseOut$, mouseUp$, mouseWheel$ } = this.eventService.getMouseEvents(this.canvas.nativeElement);

    const normalizedPoints$ = this.configurationService.getNormalizedPoints();

    const mouseHoversCircle$ = combineLatest([mouseMove$, normalizedPoints$]).pipe(
      map(([event, points]) => this.touchAreaService.checkIfMouseOnCircles(event, points, this.ctx!)),
      startWith(false),
      distinctUntilChanged()
    );

    const mouseEventOnCircle$ = mouseHoversCircle$.pipe(
      switchMap(() => mouseDown$)
    );

    const activePointIndex$ = mouseEventOnCircle$.pipe(
      withLatestFrom(normalizedPoints$),
      switchMap(([event, points]) => this.touchAreaService.getHoveredCircles(event, points, this.ctx!)),
      distinctUntilChanged()
    );

    const dragDropMoveLeft$ = mouseEventOnCircle$.pipe(
      filter((event: MouseEvent) => event.button === 0),
      switchMap(() => mouseMove$.pipe(
        pairwise(),
        takeUntil(race(mouseUp$, mouseOut$))
      ))
    );

    this.subscriptions.push(
      this.configurationService.background$.subscribe(() => {
        this.backgroundPath = this.configurationService.getBackgroundImage();
      }),

      combineLatest([normalizedPoints$, windowSize$, layers$]).pipe(
        map(([points]) => {
          const newSize = { width: Number(this.hostElement.nativeElement.offsetWidth), height:  Number(this.hostElement.nativeElement.offsetHeight)};
          return points.map(p => this.touchAreaService.circleDtoFromNormalizedPoint(p, newSize, this.layers))
         })
      ).subscribe(circleDtos => this.drawCircleDtos(circleDtos)),

      windowSize$.subscribe(size => {
        if (this.canvas?.nativeElement !== undefined) {
          this.canvas.nativeElement.width = Number(this.hostElement.nativeElement.offsetWidth);
          this.canvas.nativeElement.height = Number(this.hostElement.nativeElement.offsetHeight);
        }
      }),

      mouseDown$.pipe(
        withLatestFrom(mouseHoversCircle$),
        filter(([event, bool]) => event.button === 0 && !bool),
        map(([event], index) => this.touchAreaService.normalizedPointFromEvent(event, index)),
        withLatestFrom(normalizedPoints$, amountTouchPoints$),
        map(([point, points, amount]) => this.touchAreaService.addNormalizedPoint(point, points, amount))
      ).subscribe(points => {
        this.configurationService.setNormalizedPoints(points);
        const lastPoint = points[points.length - 1];
        this.gestureService.addPoint(lastPoint.x, lastPoint.y, lastPoint.z);
      }),

      mouseDown$.pipe(
        filter(event => event.button === 2),
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.touchAreaService.deleteNormalizedPoints(event, points, this.ctx!))
      ).subscribe(points => this.configurationService.setNormalizedPoints(points)),

      dragDropMoveLeft$.pipe(
        withLatestFrom(activePointIndex$, normalizedPoints$),
        map(([[event1, event2], index, points]) => this.touchAreaService.movePointFromEvent(event1, event2, index, points, this.ctx!))
      ).subscribe(points => this.configurationService.setNormalizedPoints(points)),

      mouseWheel$.pipe(
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.touchAreaService.resizeNormalizedPoints(event, points, this.ctx!, this.layers))
      ).subscribe(points => this.configurationService.setNormalizedPoints(points)),

      normalizedPoints$.pipe(
        map(points => points.map(p => this.touchAreaService.touchPointFromNormalizedPoint(p)))
      ).subscribe(touchPoints => this.connectionService.sendMessage(touchPoints)),

      amountTouchPoints$.pipe(
        withLatestFrom(normalizedPoints$),
        map(([amount, points]) => this.touchAreaService.sliceToMax(amount, points))
      ).subscribe(points => this.configurationService.setNormalizedPoints(points)),

      layers$.subscribe(layers => this.layers = layers)
    );
  }

  private drawCircleDtos(circleDtos: CircleDto[]): void {
    if (this.ctx === undefined) {
      return;
    }
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.globalAlpha = 0.5;
    circleDtos.forEach(circleDto => this.circleRenderer?.draw(circleDto));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.configurationService.amountTouchPoints$.unsubscribe();
    this.configurationService.background$.unsubscribe();

    this.connectionService.disconnect();
  }
}
