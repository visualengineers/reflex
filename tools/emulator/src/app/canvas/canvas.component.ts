import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { Observable, Subscription, combineLatest, race } from 'rxjs';
import { NormalizedPoint } from '../model/NormalizedPoint.model';

import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  startWith,
  switchMap,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';
import { ConfigurationService, Layers } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { CircleDto, CircleRenderer } from '../shapes/Circle';
import { CanvasPointGeometry } from './canvas-point-geometry';
import { canvasMouseEvents, windowSizeChanges } from './canvas-streams';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule]
})
export class CanvasComponent implements OnInit, OnDestroy {

  @ViewChild('canvas', { static: true }) public canvas?: ElementRef<HTMLCanvasElement>;

  public backgroundPath = '';
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly connectionService = inject(ConnectionService);
  private readonly configurationService = inject(ConfigurationService);

  private addNormalizedPointsSubscription?: Subscription;

  private amountTouchPointsSubscription?: Subscription;

  private circleRenderer?: CircleRenderer;

  private ctx?: CanvasRenderingContext2D;

  private deleteNormalizedPointsSubscription?: Subscription;

  private drawCirclesSubscription?: Subscription;

  private layers?: Layers;

  private layersSubscription?: Subscription;
  private backgroundSubscription?: Subscription;

  private moveNormalizedPointsSubscription?: Subscription;

  private resizeCanvasSubscription?: Subscription;

  private resizeNormalizedPointsSubscription?: Subscription;

  private sendTouchPointsSubscription?: Subscription;

  private suppressContextMenuSubscription?: Subscription;

  private readonly geometry = new CanvasPointGeometry(this.configurationService, () => this.ctx, () => this.layers);

  public ngOnInit(): void {
    // PRIVATE VARIABLES
    if (this.canvas?.nativeElement !== undefined) {
      this.ctx = this.canvas.nativeElement.getContext(
        '2d'
      ) as CanvasRenderingContext2D;
    }

    this.circleRenderer = new CircleRenderer(
      this.ctx,
      this.configurationService
    );

    // OBSERVABLES
    const windowSize$ = windowSizeChanges();

    const amountTouchPoints$ = this.configurationService.getAmountTouchPoints();
    const layers$ = this.configurationService.getLayers();

    if (this.canvas?.nativeElement === undefined) {
      return;
    }

    const { contextMenu$, mouseDown$, mouseMove$, mouseOut$, mouseUp$, mouseWheel$ } = canvasMouseEvents(this.canvas.nativeElement);
    const normalizedPoints$ = this.configurationService.getNormalizedPoints(); // point subject in configuration service (multicasting!)

    // whether circles are currently hovered or not
    const mouseHoversCircle$ = combineLatest([
      mouseMove$,
      normalizedPoints$
    ]).pipe(
      map(([event, points]) => this.geometry.checkIfMouseOnCircles(event, points)),
      startWith(false),
      distinctUntilChanged()
    );

    // position of last mouseDown$ or mouseWheel$ on a circle
    const mouseEventOnCircle$ = mouseHoversCircle$.pipe(
      switchMap(() => mouseDown$)
    );

    // index of circle on which latest mouse event happened
    const activePointIndex$ = mouseEventOnCircle$.pipe(
      withLatestFrom(normalizedPoints$),
      switchMap(([event, points]) => this.geometry.getHoveredCircles(event, points)),
      distinctUntilChanged()
    );

    // drag and drop move left
    const dragDropMoveLeft$ = mouseEventOnCircle$.pipe(
      filter((event: MouseEvent) => event.button === 0), // only left mouse downs
      switchMap(() =>
        mouseMove$.pipe(
          pairwise(), // to calculate movement, two consecutive values are needed
          takeUntil(race(mouseUp$, mouseOut$))
        ))
    );

    // SUBSCRIPTIONS

    // html canvas element
    this.subscribeToBackground();

    this.subscribeToDrawCircles(normalizedPoints$, windowSize$, layers$);

    this.subscribeToResizeCanvas(windowSize$);

    // normalized points modifications
    this.subscribeToAddNormalizedPoints(mouseDown$, mouseHoversCircle$, normalizedPoints$, amountTouchPoints$);

    this.subscribeToDeleteNormalizedPoints(mouseDown$, normalizedPoints$);

    this.subscribeToMoveNormalizedPoints(dragDropMoveLeft$, activePointIndex$, normalizedPoints$);

    this.subscribeToResizeNormalizedPoints(mouseWheel$, normalizedPoints$);

    // suppress default contextmenu
    this.subscribeToSuppressContextMenu(contextMenu$);

    // functionality and information sending
    this.subscribeToSendTouchPoints(normalizedPoints$);

    this.subscribeToAmountTouchPoints(amountTouchPoints$, normalizedPoints$);

    this.subscribeToLayers(layers$);
  }

  public ngOnDestroy(): void {
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
    this.backgroundSubscription?.unsubscribe();

    this.connectionService.disconnect();
  }

  /**
   * draws list of circleDtos on canvas.
   * @param circleDtos list of circleDtos to draw
   */
  private drawCircleDtos(circleDtos: Array<CircleDto>): void {
    if (this.ctx === undefined) {
      return;
    }

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    circleDtos.forEach((circleDto) => this.circleRenderer?.draw(circleDto));
  }

  private subscribeToBackground(): void {
    this.backgroundSubscription
      = this.configurationService.background$.subscribe(() => {
        this.backgroundPath = this.configurationService.getBackgroundImage();
        this.changeDetector.markForCheck();
      });
  }

  private subscribeToDrawCircles(normalizedPoints$: Observable<Array<NormalizedPoint>>, windowSize$: Observable<{ width: number; height: number }>, layers$: Observable<Layers>): void {
    this.drawCirclesSubscription = combineLatest([
      normalizedPoints$,
      windowSize$,
      layers$
    ])
      .pipe(
        map(([points, size]) =>
          points.map((p) => this.geometry.circleDtoFromNormalizedPoint(p, size)))
      )
      .subscribe((circleDtos) => this.drawCircleDtos(circleDtos));
  }

  private subscribeToResizeCanvas(windowSize$: Observable<{ width: number; height: number }>): void {
    this.resizeCanvasSubscription = windowSize$.subscribe((size) => {
      if (this.canvas?.nativeElement === undefined) {
        return;
      }
      this.canvas.nativeElement.width = size.width;
      this.canvas.nativeElement.height = size.height;
    });
  }

  private subscribeToAddNormalizedPoints(mouseDown$: Observable<MouseEvent>, mouseHoversCircle$: Observable<boolean>, normalizedPoints$: Observable<Array<NormalizedPoint>>, amountTouchPoints$: Observable<number>): void {
    this.addNormalizedPointsSubscription = mouseDown$
      .pipe(
        withLatestFrom(mouseHoversCircle$),
        filter(([event, bool]) => event.button === 0 && !bool), // left mousedown  + on plain canvas
        map(([event]) => event),
        map((event, index) => this.geometry.normalizedPointFromEvent(event, index)), // creates new NormalizedPoint
        withLatestFrom(normalizedPoints$, amountTouchPoints$),
        map(([point, points, amount]) =>
          this.geometry.addNormalizedPoint(point, points, amount))
      )
      .subscribe((x) => this.configurationService.setNormalizedPoints(x));
  }

  private subscribeToDeleteNormalizedPoints(mouseDown$: Observable<MouseEvent>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.deleteNormalizedPointsSubscription = mouseDown$
      .pipe(
        filter((event: MouseEvent) => event.button === 2), // right mousedown on circle
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.geometry.deleteNormalizedPoints(event, points))
      )
      .subscribe((x) => this.configurationService.setNormalizedPoints(x));
  }

  private subscribeToMoveNormalizedPoints(dragDropMoveLeft$: Observable<[MouseEvent, MouseEvent]>, activePointIndex$: Observable<number>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.moveNormalizedPointsSubscription = dragDropMoveLeft$
      .pipe(
        withLatestFrom(activePointIndex$, normalizedPoints$),
        map(([[event1, event2], index, points]) =>
          this.geometry.movePointFromEvent(event1, event2, index, points))
      )
      .subscribe((x) => this.configurationService.setNormalizedPoints(x));
  }

  private subscribeToResizeNormalizedPoints(mouseWheel$: Observable<WheelEvent>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.resizeNormalizedPointsSubscription = mouseWheel$
      .pipe(
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.geometry.resizeNormalizedPoints(event, points))
      )
      .subscribe((x) => this.configurationService.setNormalizedPoints(x));
  }

  private subscribeToSuppressContextMenu(contextMenu$: Observable<MouseEvent>): void {
    this.suppressContextMenuSubscription = contextMenu$
      .pipe(
        map((e) => {
          e.preventDefault();

          return false;
        })
      )
      .subscribe();
  }

  private subscribeToSendTouchPoints(normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.sendTouchPointsSubscription = normalizedPoints$
      .pipe(
        map((points) =>
          points.map((p) => this.geometry.touchPointFromNormalizedPoint(p)))
      )
      .subscribe((touchPoints) =>
        this.connectionService.sendMessage(touchPoints));
  }

  private subscribeToAmountTouchPoints(amountTouchPoints$: Observable<number>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.amountTouchPointsSubscription = amountTouchPoints$
      .pipe(
        withLatestFrom(normalizedPoints$),
        map(([amount, points]) => this.geometry.sliceToMax(amount, points))
      )
      .subscribe((x) => this.configurationService.setNormalizedPoints(x));
  }

  private subscribeToLayers(layers$: Observable<Layers>): void {
    this.layersSubscription = layers$.subscribe((l) => (this.layers = l));
  }
}
