import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { combineLatest, fromEvent, Subscription, race} from 'rxjs';
import { distinctUntilChanged, map, filter, publishBehavior, refCount, switchMap, takeUntil, debounceTime, withLatestFrom, startWith, pairwise } from 'rxjs/operators';
import { NormalizedPoint } from '../model/NormalizedPoint.model';
import { ConfigurationService, Layers } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { CircleDto, CircleRenderer } from '../shapes/Circle';
import { environment } from 'src/environments/environment';
import { ExtremumType, Interaction } from '@reflex/shared-types';

interface Size {
  width: number;
  height: number;
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.sass']
})
export class CanvasComponent implements OnInit, OnDestroy {

  @ViewChild('canvas', {static: true}) canvas?: ElementRef<HTMLCanvasElement>;

  private addNormalizedPointsSubscription?: Subscription;

  private amountTouchPointsSubscription?: Subscription;

  public backgroundPath: string = '';

  private circleRenderer?: CircleRenderer;

  private ctx?: CanvasRenderingContext2D;

  private deleteNormalizedPointsSubscription?: Subscription;

  private drawCirclesSubscription?: Subscription;

  private layers?: Layers;

  private layersSubscription?: Subscription;

  private moveNormalizedPointsSubscription?: Subscription;

  private resizeCanvasSubscription?: Subscription;

  private resizeNormalizedPointsSubscription?: Subscription;

  private sendTouchPointsSubscription?: Subscription;

  private suppressContextMenuSubscription?: Subscription;

  constructor(
    private connectionService: ConnectionService,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {

    // PRIVATE VARIABLES
    if (this.canvas?.nativeElement !== undefined) {
      this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    this.circleRenderer = new CircleRenderer(this.ctx, this.configurationService);

    // OBSERVABLES
    const windowSize$ = fromEvent(window, 'resize')
      .pipe(
        map(() => ({ width: window.innerWidth, height: window.innerHeight } as Size)),
        // only react to actual changed values and wait for a stable value (debounce)
        distinctUntilChanged((a, b) => a.width === b.width && a.height === b.height),
        debounceTime(100),
        // window size used by multiple observers, by making it a 'hot' observable we keep the most recent value in a buffer
        publishBehavior({ width: window.innerWidth, height: window.innerHeight } as Size),
        refCount()
      );

    const amountTouchPoints$ = this.configurationService.getAmountTouchPoints();
    const layers$ = this.configurationService.getLayers();

    if (this.canvas?.nativeElement === undefined) {
      return;
    }


    const contextMenu$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'contextmenu') ;  // default menu on right click/ menu key event
    
    const mouseDown$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousedown');
    const mouseMove$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousemove');
    const mouseOut$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mouseout');
    const mouseUp$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mouseup');
    const mouseWheel$ = fromEvent<WheelEvent>(this.canvas.nativeElement, 'wheel');
    const normalizedPoints$ = this.configurationService.getNormalizedPoints(); // point subject in configuration service (multicasting!)

    // whether circles are currently hovered or not
    const mouseHoversCircle$ = combineLatest([( mouseMove$ || mouseDown$ ), normalizedPoints$ ])
    .pipe(
      map(([event, points]) => this.checkIfMouseOnCircles(event, points)),
      startWith(false),
      distinctUntilChanged()
    );

    // position of last mouseDown$ or mouseWheel$ on a circle
    const mouseEventOnCircle$ = mouseHoversCircle$
      .pipe(switchMap(() => (mouseDown$ || mouseWheel$)));

    // index of circle on which latest mouse event happened
    const activePointIndex$ = mouseEventOnCircle$.pipe(
      withLatestFrom(normalizedPoints$),
      switchMap(([event, points]) => this.getHoveredCircles(event, points)),
      distinctUntilChanged()
    );

    // drag and drop move left
    const dragDropMoveLeft$ = mouseEventOnCircle$
      .pipe(
        filter((event: MouseEvent) => event.button === 0), // only left mouse downs
        switchMap(() => mouseMove$
          .pipe(
            pairwise(), // to calculate movement, two consecutive values are needed
            takeUntil(race(mouseUp$, mouseOut$))
          )
        )
      );

  // SUBSCRIPTIONS

    // html canvas element
    this.configurationService.background$
      .subscribe(x => {this.backgroundPath = this.configurationService.getBackgroundImage(); });

    this.drawCirclesSubscription = combineLatest([normalizedPoints$, windowSize$, layers$])
      .pipe(
        map(([points, size, layers]) => points.map(p => this.circleDtoFromNormalizedPoint(p, size)))
      )
      .subscribe(circleDtos => this.drawCircleDtos(circleDtos));

    this.resizeCanvasSubscription = windowSize$
      .subscribe(size => {
        if (this.canvas?.nativeElement === undefined) {
          return;
        }
        this.canvas.nativeElement.width = size.width;
        this.canvas.nativeElement.height = size.height;
      });

    // normalized points modifications
    this.addNormalizedPointsSubscription = mouseDown$
      .pipe(
        withLatestFrom(mouseHoversCircle$),
        filter(([event, bool]) => (event.button === 0 && bool === false)), // left mousedown  + on plain canvas
        map(([event]) => event),
        map((event, index) => this.normalizedPointFromEvent(event, index)), // creates new NormalizedPoint
        withLatestFrom(normalizedPoints$, amountTouchPoints$),
        map(([point, points, amount]) => this.addNormalizedPoint(point, points, amount))
      )
      .subscribe(x => this.configurationService.setNormalizedPoints(x));

    this.deleteNormalizedPointsSubscription = mouseDown$
      .pipe(
        filter((event: MouseEvent) => event.button === 2), // right mousedown on circle
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.deleteNormalizedPoints(event, points))
      )
      .subscribe(x => this.configurationService.setNormalizedPoints(x));

    this.moveNormalizedPointsSubscription = dragDropMoveLeft$
      .pipe(
        withLatestFrom(activePointIndex$, normalizedPoints$),
        map(([[event1, event2], index, points]) => this.movePointFromEvent(event1, event2, index, points))
      )
      .subscribe(x => this.configurationService.setNormalizedPoints(x));

    this.resizeNormalizedPointsSubscription = mouseWheel$
      .pipe(
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.resizeNormalizedPoints(event, points))
      )
      .subscribe(x => this.configurationService.setNormalizedPoints(x));

    // suppress default contextmenu
    this.suppressContextMenuSubscription = contextMenu$
      .pipe(
        map(e => { e.preventDefault(); return false; })
      )
      .subscribe();

      

    // functionality and information sending
    this.sendTouchPointsSubscription = normalizedPoints$
      .pipe(
        map(points => points.map(p => this.touchPointFromNormalizedPoint(p)))
      )
      .subscribe(touchPoints => this.connectionService.sendMessage(touchPoints) );

    this.amountTouchPointsSubscription = amountTouchPoints$
      .pipe(
          withLatestFrom(normalizedPoints$),
          map(([amount, points]) => this.sliceToMax(amount, points))
        )
      .subscribe(x => this.configurationService.setNormalizedPoints(x));

    this.layersSubscription = layers$
      .subscribe( l => this.layers = l);

  }

  /**
   * add point to list if click event occured on plain canvas.
   * @param point the normalized point to insert
   * @param p list of current normalized points
   * @param maxAmount max amount of touch points to be drawn
   * @return updated list of normalized points
   */
  private addNormalizedPoint( point: NormalizedPoint, p: NormalizedPoint[], maxAmount: number ): NormalizedPoint[] {

    p.push(point); // (re-)append the current point to the back

    return this.sliceToMax(maxAmount, p);
  }

  /**
   * Converts a normalized point to a circle dto, by multiplying with the canvas size passed into the method
   * @param p the point to convert
   * @param canvasSize the size of the canvas
   */
  private circleDtoFromNormalizedPoint(p: NormalizedPoint, canvasSize: Size): CircleDto {

    const circleSize = this.configurationService.getCircleSize(); // upper & lower circle size limits (px) from settings

    return {
      posX: p.x * canvasSize.width,
      posY: p.y * canvasSize.height,
      radius: Math.abs(p.z) * circleSize.max + circleSize.min,
      color: (Math.sign(p.z) > 0) ? this.layers?.colorUp ?? '' : this.layers?.colorDown ?? ''  // assign different colors for push / pull points
    };

  }

  /**
   * checks if pointer is currently on at least one of the circles.
   * @param event MouseEvent | PointerEvents
   * @param p list of normalized points
   * @return true: pointer is on at least one the circles | false: pointer is on plain canvas
   */
  private checkIfMouseOnCircles(event: MouseEvent | PointerEvent | WheelEvent, p: NormalizedPoint[]): boolean {

    return (this.getHoveredCircles(event, p).length > 0) ? true : false;
  }

  /**
   * delete point(s) from list if click event occured on them.
   * @param event MouseEvent | PointerEvents
   * @param p list of normalized points
   * @return updated list of normalized points
   */
  private deleteNormalizedPoints( event: MouseEvent | PointerEvent, p: NormalizedPoint[] ): NormalizedPoint[] {

    const indices = this.getHoveredCircles(event, p);

    return p.filter((item) => !indices.includes(item.index));
  }

  /**
   * draws list of circleDtos on canvas.
   * @param circleDtos list of circleDtos to draw
   */
  private drawCircleDtos(circleDtos: CircleDto[]): void {
    if (this.ctx === undefined) {
      return;
    }

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    circleDtos.forEach(circleDto => this.circleRenderer?.draw(circleDto));
  }

  /**
   * get points affected by mouse or wheel events.
   * @param event MouseEvent | PointerEvents
   * @param p list of normalized points
   * @return list of indices of points on which click / wheel event occured on.
   */
  private getHoveredCircles(event: MouseEvent | PointerEvent | WheelEvent, p: NormalizedPoint[]): number[] {

    const indices: number[] = [];

    // don't mess up with the order: first remains first point; adding on top; deleting in-place
    p.forEach((point, i) => {
      if (this.isEventOnCircle(event, point)) {
        indices.push(point.index);
      }
    });

    return indices;

  }

   /**
    * tells whether a point's corresponding circle on the canvas is currently hovered or not.
    * @param event MouseEvent | PointerEvents
    * @param point normalized point
    * @return true: circle is hovered | false: circle is not hovered
    */
   private isEventOnCircle(event: MouseEvent | PointerEvent | WheelEvent, point: NormalizedPoint): boolean {

    if (this.ctx === undefined) {
      return false;
    }
    // de-normalization
    // TODO use function this.circleDtoFromNormalizedPoint to handle this !
    const xDiff = (point.x * this.ctx.canvas.width) - event.x;
    const yDiff = (point.y * this.ctx.canvas.height) - event.y;
    const radius = this.configurationService.getCircleSize().min + Math.abs(point.z);

    // calculate distance from point center to pointer position with Pythagoras (in px, because 'z' can hardly be normalized)
    const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    const isOnCircle = (distance < radius ) ? true : false;

    return isOnCircle;
  }

   /**
    * Moves point(s) if drag and drop event occured on them.
    * @param event MouseEvent | PointerEvents
    * @param p list of NormalizedPoints
    * @return list of normalized points with updated point.x and point.y values..
    */
  private movePointFromEvent( event1: MouseEvent | PointerEvent, event2: MouseEvent | PointerEvent, index: number, p: NormalizedPoint[] ): NormalizedPoint[] {

    // TODO use function this.circleDtofromNormalizedPoint for cleaner code here !
    // incremental differences in movement
    const xDiff = event2.x - event1.x;
    const yDiff = event2.y - event1.y;

    p.forEach((point, i) => {
      if (index === point.index) {
        point.x += xDiff / (this.ctx?.canvas?.width ?? 1);
        point.y += yDiff / (this.ctx?.canvas?.height ?? 1);
      }
    });

    return p;
  }

  /**
   * Creates a normalized point (x, y in [0, 1]) from a mouse or pointer event.
   * @param param0 the destructured parameters needed for calculation of the normalized point
   * @param index the serial number of the event. This is needed for replacement in the FIFO queue.
   */
  private normalizedPointFromEvent({target, offsetX, offsetY}: MouseEvent | PointerEvent, index: number): NormalizedPoint {
    return {
      x: offsetX / (target as HTMLElement).clientWidth,
      y: offsetY / (target as HTMLElement).clientHeight,
      time: Date.now(),
      index,
      z: 0
    };
  }

   /**
    * Resizes point(s) on wheel events using normalized values.
    * @param event MouseEvent | PointerEvents
    * @param p list of normalized points
    * @return list of normalized points, updated point.z values.
    */
  private resizeNormalizedPoints( event: WheelEvent, p: NormalizedPoint[] ): NormalizedPoint[] {

    // 1: move up; -1: move down
    const mouseDirection = (event.deltaY < 0) ? -1 : 1;

    // check if there are more push / pull layers (to define "1" for zvalue normalization)
    const maxAmountLayers = Math.max(this.layers?.up ?? 0, this.layers?.down ?? 0);

    // ...and set normalized z resizing limits based on that
    const normalizedPullLimit = ((this.layers?.up ?? 0) / maxAmountLayers);
    const normalizedPushLimit = ((this.layers?.down ?? 0) / maxAmountLayers) * (-1);

    // speed up scaling with steps of either -/+ 0.05
    // hardcoded value can be changed, turned out to be a good choice when testing
    let scaleStep = environment.scaleStep;
    scaleStep *= mouseDirection;

    // actual resizing
    p.forEach((point, i) => {
      if (this.isEventOnCircle(event, point)) {
        point.z = Math.min(Math.max(normalizedPushLimit, point.z + scaleStep), normalizedPullLimit);
      }
    });

    return p;
  }

  /**
   * Slices an array of normalized points to a given max length (FIFO)
   * @param maxAmount max amount of items allowed in the array
   * @param p array of normalized points
   * @return sliced array of normalized points
   */
  private sliceToMax(maxAmount: number, p: NormalizedPoint[]): NormalizedPoint[] {

    return p.slice(-maxAmount);
  }

  /**
   * Converts a normalized point (0.0 - 1.0) to a touch point, by multiplying x and y by the configured viewport size
   * @param p the point to convert
   */
  private touchPointFromNormalizedPoint(p: NormalizedPoint): Interaction {
    return {
      position: {
        x: p.x * this.configurationService.getViewPort().width,
        y: p.y * this.configurationService.getViewPort().height,
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
