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
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, combineLatest, fromEvent, race } from 'rxjs';
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
import { HoverMenuComponent } from '../hover-menu/hover-menu.component';

import { ConfigurationService, Layers } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { GestureDataService } from '../service/gesture-data.service';
import { GestureReplayService } from '../service/gesture-replay.service';
import { CircleDto, CircleRenderer } from '../shapes/Circle';
import { EventService } from './service/event.service';
import { TouchAreaService } from './service/touch-area.service';
import { updateGesturePoint } from './touch-area-editing';
import { playbackCircles, renderTouchArea } from './touch-area-rendering';
import { windowSizeChanges } from './touch-area-streams';

@Component({
  selector: 'app-touch-area',
  imports: [HoverMenuComponent, CommonModule, FormsModule],
  templateUrl: './touch-area.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./touch-area.component.scss']
})
export class TouchAreaComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) public canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild(HoverMenuComponent) public hoverMenu?: HoverMenuComponent;

  public backgroundPath = ''; // To track the animated circle
  public hoveredPoint: NormalizedPoint | null = null;
  public menuPosition = { x: 0, y: 0 };
  public isHoverMenuFixed = false;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly connectionService = inject(ConnectionService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly eventService = inject(EventService);
  private readonly touchAreaService = inject(TouchAreaService);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gestureService = inject(GestureDataService);
  private readonly gestureReplayService = inject(GestureReplayService);
  private ctx?: CanvasRenderingContext2D;
  private layers?: Layers;
  private readonly subscriptions: Array<Subscription> = [];
  private circleRenderer?: CircleRenderer;
  private drawnCircleDtos: Array<CircleDto> = []; // To keep track of drawn circles
  private animatedCircleDto?: CircleDto;

  public ngOnInit(): void {
    if (this.canvas?.nativeElement !== undefined) {
      this.ctx = this.canvas.nativeElement.getContext(
        '2d'
      ) as CanvasRenderingContext2D;
    }

    const context = this.ctx;
    if (context === undefined) {
      return;
    }

    this.subscribeToPlayback();

    this.circleRenderer = new CircleRenderer(
      this.ctx,
      this.configurationService
    );

    const windowSize$ = windowSizeChanges();

    const amountTouchPoints$ = this.configurationService.getAmountTouchPoints();
    const layers$ = this.configurationService.getLayers();

    if (this.canvas?.nativeElement === undefined) {
      return;
    }

    const { mouseDown$, mouseMove$, mouseOut$, mouseUp$, mouseWheel$ }
      = this.eventService.getMouseEvents(this.canvas.nativeElement);

    const normalizedPoints$ = this.configurationService.getNormalizedPoints();

    const mouseMiddleClick$ = fromEvent<MouseEvent>(
      this.canvas.nativeElement,
      'mousedown'
    ).pipe(
      filter((event) => event.button === 1) // 1 steht für die mittlere Maustaste (Mausrad)
    );

    const mouseHoversCircle$ = combineLatest([
      mouseMove$,
      this.configurationService.getNormalizedPoints()
    ]).pipe(
      map(([event, points]) => {
        if (this.hoverMenu?.isFixed === true) {
          return true; // Wenn das Menü fixiert ist, bleiben wir im Hover-Zustand
        }

        const hoveredCircles = this.touchAreaService.getHoveredCircles(
          event,
          points,
          context
        );
        if (hoveredCircles.length > 0) {
          this.hoveredPoint = points[hoveredCircles[0]];
          this.updateMenuPosition(event);
        } else {
          this.hoveredPoint = null;
        }
        this.changeDetector.markForCheck();

        return hoveredCircles.length > 0;
      }),
      startWith(false),
      distinctUntilChanged()
    );

    const mouseEventOnCircle$ = mouseHoversCircle$.pipe(
      switchMap(() => mouseDown$)
    );

    const activePointIndex$ = mouseEventOnCircle$.pipe(
      withLatestFrom(normalizedPoints$),
      switchMap(([event, points]) =>
        this.touchAreaService.getHoveredCircles(event, points, context)),
      distinctUntilChanged()
    );

    const dragDropMoveLeft$ = mouseEventOnCircle$.pipe(
      filter((event: MouseEvent) => event.button === 0),
      switchMap(() =>
        mouseMove$.pipe(pairwise(), takeUntil(race(mouseUp$, mouseOut$))))
    );

    this.subscribeToInteractions({ normalizedPoints$, windowSize$, layers$, mouseDown$, mouseHoversCircle$, amountTouchPoints$, dragDropMoveLeft$, activePointIndex$, mouseWheel$, mouseMiddleClick$ });
  }

  public onPointUpdated(updatedPoint: NormalizedPoint): void {
    updateGesturePoint(updatedPoint, {
      configuration: this.configurationService,
      gestures: this.gestureService,
      touchArea: this.touchAreaService,
      redraw: () => this.drawCircleDtos()
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.connectionService.disconnect();
  }

  private updateMenuPosition(event: MouseEvent): void {
    this.menuPosition = {
      x: event.clientX + 10,
      y: event.clientY + 10
    };
  }

  private drawCircleDtos(): void {
    renderTouchArea(this.ctx, this.circleRenderer, this.drawnCircleDtos, this.animatedCircleDto);
  }

  private drawAnimation(dto: CircleDto): void {
    // Update the animated circle DTO
    this.animatedCircleDto = dto;
    this.drawCircleDtos();
  }

  private subscribeToPlayback(): void {
    this.subscriptions.push(playbackCircles(this.gestureReplayService.playbackFrame$, this.canvas?.nativeElement, () => this.layers, this.touchAreaService).subscribe((dto) => this.drawAnimation(dto)));
  }

  private subscribeToInteractions({ normalizedPoints$, windowSize$, layers$, mouseDown$, mouseHoversCircle$, amountTouchPoints$, dragDropMoveLeft$, activePointIndex$, mouseWheel$, mouseMiddleClick$ }: { normalizedPoints$: Observable<Array<NormalizedPoint>>; windowSize$: Observable<{ width: number; height: number }>; layers$: Observable<Layers>; mouseDown$: Observable<MouseEvent>; mouseHoversCircle$: Observable<boolean>; amountTouchPoints$: Observable<number>; dragDropMoveLeft$: Observable<[MouseEvent, MouseEvent]>; activePointIndex$: Observable<number>; mouseWheel$: Observable<WheelEvent>; mouseMiddleClick$: Observable<MouseEvent> }): void {
    this.subscriptions.push(this.configurationService.background$.subscribe(() => {
      this.backgroundPath = this.configurationService.getBackgroundImage();
      this.changeDetector.markForCheck();
      console.log('backgroundPath TouchArea:', this.backgroundPath);
    }));
    this.subscribeToDrawing(normalizedPoints$, windowSize$, layers$);
    this.subscribeToCanvasResize(windowSize$);
    this.subscribeToAddingPoints(mouseDown$, mouseHoversCircle$, normalizedPoints$, amountTouchPoints$);
    this.subscribeToDeletingPoints(mouseDown$, normalizedPoints$);
    this.subscribeToMovingPoints(dragDropMoveLeft$, activePointIndex$, normalizedPoints$);
    this.subscribeToResizingPoints(mouseWheel$, normalizedPoints$);
    this.subscribeToRecordedPoints(normalizedPoints$);
    this.subscribeToPointCount(amountTouchPoints$, normalizedPoints$);
    this.subscriptions.push(layers$.subscribe((layers) => (this.layers = layers)));
    this.subscriptions.push(mouseHoversCircle$.subscribe());
    this.subscribeToMenuToggle(mouseMiddleClick$);
  }

  private subscribeToDrawing(normalizedPoints$: Observable<Array<NormalizedPoint>>, windowSize$: Observable<{ width: number; height: number }>, layers$: Observable<Layers>): void {
    this.subscriptions.push(combineLatest([normalizedPoints$, windowSize$, layers$])
      .pipe(
        map(([points]) => {
          const newSize = {
            width: Number(this.hostElement.nativeElement.offsetWidth),
            height: Number(this.hostElement.nativeElement.offsetHeight)
          };

          return points.map((p) =>
            this.touchAreaService.circleDtoFromNormalizedPoint(
              p,
              newSize,
              this.layers
            ));
        })
      )
      .subscribe((circleDtos) => {
        this.drawnCircleDtos = circleDtos; // Store drawn circles
        this.drawCircleDtos();
      }));
  }

  private subscribeToCanvasResize(windowSize$: Observable<{ width: number; height: number }>): void {
    this.subscriptions.push(windowSize$.subscribe(() => {
      if (this.canvas?.nativeElement !== undefined) {
        this.canvas.nativeElement.width = Number(
          this.hostElement.nativeElement.offsetWidth
        );
        this.canvas.nativeElement.height = Number(
          this.hostElement.nativeElement.offsetHeight
        );
      }
    }));
  }

  private subscribeToAddingPoints(mouseDown$: Observable<MouseEvent>, mouseHoversCircle$: Observable<boolean>, normalizedPoints$: Observable<Array<NormalizedPoint>>, amountTouchPoints$: Observable<number>): void {
    this.subscriptions.push(mouseDown$
      .pipe(
        withLatestFrom(mouseHoversCircle$),
        filter(([event, bool]) => event.button === 0 && !bool),
        map(([event], index) =>
          this.touchAreaService.normalizedPointFromEvent(event, index)),
        withLatestFrom(normalizedPoints$, amountTouchPoints$),
        map(([point, points, amount]) =>
          this.touchAreaService.addNormalizedPoint(point, points, amount))
      )
      .subscribe((points) => {
        this.configurationService.setNormalizedPoints(points);
      }));
  }

  private subscribeToDeletingPoints(mouseDown$: Observable<MouseEvent>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    const context = this.ctx;
    if (context === undefined) {
      return;
    }
    this.subscriptions.push(mouseDown$
      .pipe(
        filter((event) => event.button === 2),
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => {
          const indices = this.touchAreaService.getHoveredCircles(
            event,
            points,
            context
          );
          if (indices.length > 0) {
            const frame
                = this.gestureService.getGestureTrackFrames()[indices[0]];
            this.gestureService.deleteGestureTrackFrame(frame);
            points.splice(indices[0], 1);
          }

          return points;
        })
      )
      .subscribe((points) => {
        this.configurationService.setNormalizedPoints(points);
        const gestureTrackFrames = points.map((p) =>
          this.touchAreaService.touchPointFromNormalizedPoint(p));
        gestureTrackFrames.forEach((gestureTrackFrame) => {
          this.gestureService.addGestureTrackFrame(gestureTrackFrame);
        });
      }));
  }

  private subscribeToMovingPoints(dragDropMoveLeft$: Observable<[MouseEvent, MouseEvent]>, activePointIndex$: Observable<number>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    const context = this.ctx;
    if (context === undefined) {
      return;
    }
    this.subscriptions.push(dragDropMoveLeft$
      .pipe(
        withLatestFrom(activePointIndex$, normalizedPoints$),
        map(([[event1, event2], index, points]) => {
          const newPoint = this.touchAreaService.movePointFromEvent(
            event1,
            event2,
            index,
            points,
            context
          )[index];
          const gestureTrackFrame
              = this.touchAreaService.touchPointFromNormalizedPoint(newPoint);
          this.gestureService.updateGestureTrackFrame(
            index,
            gestureTrackFrame.position.x,
            gestureTrackFrame.position.y,
            gestureTrackFrame.position.z
          );
          points[index] = newPoint;

          return points;
        })
      )
      .subscribe((points) =>
        this.configurationService.setNormalizedPoints(points)));
  }

  private subscribeToResizingPoints(mouseWheel$: Observable<WheelEvent>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    const context = this.ctx;
    if (context === undefined) {
      return;
    }
    this.subscriptions.push(mouseWheel$
      .pipe(
        withLatestFrom(normalizedPoints$),
        map(([event, points]) =>
          this.touchAreaService.resizeNormalizedPoints(
            event,
            points,
            context,
            this.layers
          ))
      )
      .subscribe((points) => {
        this.configurationService.setNormalizedPoints(points);
      }));
  }

  private subscribeToRecordedPoints(normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.subscriptions.push(normalizedPoints$
      .pipe(
        map((points) =>
          points.map((p) =>
            this.touchAreaService.touchPointFromNormalizedPoint(p)))
      )
      .subscribe((touchPoints) => {
        console.log('TouchPoint an GestureDataService:', touchPoints);
        touchPoints.forEach((point) => {
          this.gestureService.addGestureTrackFrame(point);
        });
      }));
  }

  private subscribeToPointCount(amountTouchPoints$: Observable<number>, normalizedPoints$: Observable<Array<NormalizedPoint>>): void {
    this.subscriptions.push(amountTouchPoints$
      .pipe(
        withLatestFrom(normalizedPoints$),
        map(([amount, points]) =>
          this.touchAreaService.sliceToMax(amount, points))
      )
      .subscribe((points) =>
        this.configurationService.setNormalizedPoints(points)));
  }

  private subscribeToMenuToggle(mouseMiddleClick$: Observable<MouseEvent>): void {
    const context = this.ctx;
    if (context === undefined) {
      return;
    }
    this.subscriptions.push(mouseMiddleClick$
      .pipe(
        withLatestFrom(this.configurationService.getNormalizedPoints()),
        filter(([event, points]) => {
          const hoveredCircles = this.touchAreaService.getHoveredCircles(
            event,
            points,
            context
          );

          return hoveredCircles.length > 0;
        })
      )
      .subscribe(() => {
        this.isHoverMenuFixed = !this.isHoverMenuFixed;
        this.changeDetector.markForCheck();
      }));
  }
}
