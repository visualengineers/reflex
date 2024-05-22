import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { combineLatest, fromEvent, Subscription, race } from 'rxjs';
import { distinctUntilChanged, map, filter, publishBehavior, refCount, switchMap, takeUntil, debounceTime, withLatestFrom, startWith, pairwise } from 'rxjs/operators';
import { NormalizedPoint } from '../model/NormalizedPoint.model';
import { ConfigurationService, Layers } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { CircleDto } from '../shapes/Circle';
import { environment } from '../../environments/environment';
import { ExtremumType, Interaction } from '@reflex/shared-types';
import { CircleRendererService } from './service/circle-renderer.service';
import { EventService } from './service/event.service';

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

  private addNormalizedPointsSubscription?: Subscription;
  private amountTouchPointsSubscription?: Subscription;
  private deleteNormalizedPointsSubscription?: Subscription;
  private drawCirclesSubscription?: Subscription;
  private layersSubscription?: Subscription;
  private moveNormalizedPointsSubscription?: Subscription;
  private resizeCanvasSubscription?: Subscription;
  private resizeNormalizedPointsSubscription?: Subscription;
  private sendTouchPointsSubscription?: Subscription;
  private suppressContextMenuSubscription?: Subscription;

  constructor(
    private connectionService: ConnectionService,
    private configurationService: ConfigurationService,
    private circleRendererService: CircleRendererService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    if (this.canvas?.nativeElement !== undefined) {
      this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
      this.circleRendererService.setContext(this.ctx);
    }

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
    const contextMenu$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'contextmenu');

    const normalizedPoints$ = this.configurationService.getNormalizedPoints();

    const mouseHoversCircle$ = combineLatest([mouseMove$, normalizedPoints$]).pipe(
      map(([event, points]) => this.checkIfMouseOnCircles(event, points)),
      startWith(false),
      distinctUntilChanged()
    );

    const mouseEventOnCircle$ = mouseHoversCircle$.pipe(
      switchMap(() => mouseDown$)
    );

    const activePointIndex$ = mouseEventOnCircle$.pipe(
      withLatestFrom(normalizedPoints$),
      switchMap(([event, points]) => this.getHoveredCircles(event, points)),
      distinctUntilChanged()
    );

    const dragDropMoveLeft$ = mouseEventOnCircle$.pipe(
      filter((event: MouseEvent) => event.button === 0),
      switchMap(() => mouseMove$.pipe(
        pairwise(),
        takeUntil(race(mouseUp$, mouseOut$))
      ))
    );

    this.configurationService.background$.subscribe(() => {
      this.backgroundPath = this.configurationService.getBackgroundImage();
    });

    this.drawCirclesSubscription = combineLatest([normalizedPoints$, windowSize$, layers$]).pipe(
      map(([points, size]) => points.map(p => this.circleDtoFromNormalizedPoint(p, size)))
    ).subscribe(circleDtos => this.drawCircleDtos(circleDtos));

    this.resizeCanvasSubscription = windowSize$.subscribe(size => {
      if (this.canvas?.nativeElement !== undefined) {
        this.canvas.nativeElement.width = size.width;
        this.canvas.nativeElement.height = size.height;
      }
    });

    this.addNormalizedPointsSubscription = mouseDown$.pipe(
      withLatestFrom(mouseHoversCircle$),
      filter(([event, bool]) => event.button === 0 && !bool),
      map(([event], index) => this.normalizedPointFromEvent(event, index)),
      withLatestFrom(normalizedPoints$, amountTouchPoints$),
      map(([point, points, amount]) => this.addNormalizedPoint(point, points, amount))
    ).subscribe(points => this.configurationService.setNormalizedPoints(points));

    this.deleteNormalizedPointsSubscription = mouseDown$.pipe(
      filter(event => event.button === 2),
      withLatestFrom(normalizedPoints$),
      map(([event, points]) => this.deleteNormalizedPoints(event, points))
    ).subscribe(points => this.configurationService.setNormalizedPoints(points));

    this.moveNormalizedPointsSubscription = dragDropMoveLeft$.pipe(
      withLatestFrom(activePointIndex$, normalizedPoints$),
      map(([[event1, event2], index, points]) => this.movePointFromEvent(event1, event2, index, points))
    ).subscribe(points => this.configurationService.setNormalizedPoints(points));

    this.resizeNormalizedPointsSubscription = mouseWheel$.pipe(
      withLatestFrom(normalizedPoints$),
      map(([event, points]) => this.resizeNormalizedPoints(event, points))
    ).subscribe(points => this.configurationService.setNormalizedPoints(points));

    this.suppressContextMenuSubscription = contextMenu$.pipe(
      map(e => {
        e.preventDefault();
        return false;
      })
    ).subscribe();

    this.sendTouchPointsSubscription = normalizedPoints$.pipe(
      map(points => points.map(p => this.touchPointFromNormalizedPoint(p)))
    ).subscribe(touchPoints => this.connectionService.sendMessage(touchPoints));

    this.amountTouchPointsSubscription = amountTouchPoints$.pipe(
      withLatestFrom(normalizedPoints$),
      map(([amount, points]) => this.sliceToMax(amount, points))
    ).subscribe(points => this.configurationService.setNormalizedPoints(points));

    this.layersSubscription = layers$.subscribe(layers => this.layers = layers);
  }

  private addNormalizedPoint(point: NormalizedPoint, p: NormalizedPoint[], maxAmount: number): NormalizedPoint[] {
    p.push(point);
    return this.sliceToMax(maxAmount, p);
  }

  private circleDtoFromNormalizedPoint(p: NormalizedPoint, canvasSize: Size): CircleDto {
    const circleSize = this.configurationService.getCircleSize();
    return {
      posX: p.x * canvasSize.width,
      posY: p.y * canvasSize.height,
      radius: Math.abs(p.z) * circleSize.max + circleSize.min,
      color: (Math.sign(p.z) > 0) ? this.layers?.colorUp ?? '' : this.layers?.colorDown ?? ''
    };
  }

  private checkIfMouseOnCircles(event: MouseEvent | PointerEvent | WheelEvent, p: NormalizedPoint[]): boolean {
    return this.getHoveredCircles(event, p).length > 0;
  }

  private deleteNormalizedPoints(event: MouseEvent | PointerEvent, p: NormalizedPoint[]): NormalizedPoint[] {
    const indices = this.getHoveredCircles(event, p);
    return p.filter((item) => !indices.includes(item.index));
  }

  private drawCircleDtos(circleDtos: CircleDto[]): void {
    if (this.ctx === undefined) {
      return;
    }
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.globalAlpha = 0.5;
    circleDtos.forEach(circleDto => this.circleRendererService.draw(circleDto));
  }

  private getHoveredCircles(event: MouseEvent | PointerEvent | WheelEvent, p: NormalizedPoint[]): number[] {
    const indices: number[] = [];
    p.forEach((point) => {
      if (this.isEventOnCircle(event, point)) {
        indices.push(point.index);
      }
    });
    return indices;
  }

  private isEventOnCircle(event: MouseEvent | PointerEvent | WheelEvent, point: NormalizedPoint): boolean {
    if (this.ctx === undefined) {
      return false;
    }
    const xDiff = (point.x * this.ctx.canvas.width) + this.ctx.canvas.offsetLeft - event.x;
    const yDiff = (point.y * this.ctx.canvas.height) + this.ctx.canvas.offsetTop - event.y;
    const radius = this.configurationService.getCircleSize().min + Math.abs(point.z);
    const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    return distance < radius;
  }

  private movePointFromEvent(event1: MouseEvent | PointerEvent, event2: MouseEvent | PointerEvent, index: number, p: NormalizedPoint[]): NormalizedPoint[] {
    const xDiff = event2.x - event1.x;
    const yDiff = event2.y - event1.y;
    p.forEach((point) => {
      if (index === point.index) {
        point.x += xDiff / (this.ctx?.canvas?.width ?? 1);
        point.y += yDiff / (this.ctx?.canvas?.height ?? 1);
      }
    });
    return p;
  }

  private normalizedPointFromEvent({ target, offsetX, offsetY }: MouseEvent | PointerEvent, index: number): NormalizedPoint {
    return {
      x: offsetX / (target as HTMLElement).clientWidth,
      y: offsetY / (target as HTMLElement).clientHeight,
      time: Date.now(),
      index,
      z: 0
    };
  }

  private resizeNormalizedPoints(event: WheelEvent, p: NormalizedPoint[]): NormalizedPoint[] {
    const mouseDirection = (event.deltaY < 0) ? -1 : 1;
    const maxAmountLayers = Math.max(this.layers?.up ?? 0, this.layers?.down ?? 0);
    const normalizedPullLimit = ((this.layers?.up ?? 0) / maxAmountLayers);
    const normalizedPushLimit = ((this.layers?.down ?? 0) / maxAmountLayers) * (-1);
    let scaleStep = environment.scaleStep;
    scaleStep *= mouseDirection;
    p.forEach((point) => {
      if (this.isEventOnCircle(event, point)) {
        point.z = Math.min(Math.max(normalizedPushLimit, point.z + scaleStep), normalizedPullLimit);
      }
    });
    return p;
  }

  private sliceToMax(maxAmount: number, p: NormalizedPoint[]): NormalizedPoint[] {
    return p.slice(-maxAmount);
  }

  private touchPointFromNormalizedPoint(p: NormalizedPoint): Interaction {
    return {
      position: {
        x: p.x * this.configurationService.getViewPort().width,
        y: p.y * this.configurationService.getViewPort().heigth,
        z: p.z,
        isValid: true,
        isFiltered: false
      },
      confidence: 1.0,
      time: p.time,
      type: 1,
      touchId: -1,
      extremumDescription: {
        type: ExtremumType.Undefined,
        numFittingPoints: 0,
        percentageFittingPoints: 0
      }
    };
  }

  ngOnDestroy() {
    this.addNormalizedPointsSubscription?.unsubscribe();
    this.amountTouchPointsSubscription?.unsubscribe();
    this.deleteNormalizedPointsSubscription?.unsubscribe();
    this.drawCirclesSubscription?.unsubscribe();
    this.layersSubscription?.unsubscribe();
    this.moveNormalizedPointsSubscription?.unsubscribe();
    this.resizeCanvasSubscription?.unsubscribe();
    this.resizeNormalizedPointsSubscription?.unsubscribe();
    this.sendTouchPointsSubscription?.unsubscribe();
    this.suppressContextMenuSubscription?.unsubscribe();
    this.configurationService.amountTouchPoints$.unsubscribe();
    this.configurationService.background$.unsubscribe();

    this.connectionService.disconnect();
  }
}
