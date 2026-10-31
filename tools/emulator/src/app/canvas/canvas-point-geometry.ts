import { ExtremumType, Interaction } from '@reflex/shared-types';
import { environment } from 'src/environments/environment';
import { NormalizedPoint } from '../model/NormalizedPoint.model';
import { ConfigurationService, Layers } from '../service/configuration.service';
import { CircleDto } from '../shapes/Circle';

interface Size {
  width: number;
  height: number;
}

export class CanvasPointGeometry {
  public constructor(private readonly configurationService: ConfigurationService, private readonly context: () => CanvasRenderingContext2D | undefined, private readonly currentLayers: () => Layers | undefined) {}
  private get ctx(): CanvasRenderingContext2D | undefined {
    return this.context();
  }

  private get layers(): Layers | undefined {
    return this.currentLayers();
  }

  public addNormalizedPoint(
    point: NormalizedPoint,
    p: Array<NormalizedPoint>,
    maxAmount: number
  ): Array<NormalizedPoint> {
    p.push(point); // (re-)append the current point to the back

    return this.sliceToMax(maxAmount, p);
  }

  public circleDtoFromNormalizedPoint(
    p: NormalizedPoint,
    canvasSize: Size
  ): CircleDto {
    const circleSize = this.configurationService.getCircleSize(); // upper & lower circle size limits (px) from settings

    return {
      posX: p.x * canvasSize.width,
      posY: p.y * canvasSize.height,
      radius: (Math.abs(p.z) * circleSize.max) + circleSize.min,
      color:
        Math.sign(p.z) > 0
          ? this.layers?.colorUp ?? ''
          : this.layers?.colorDown ?? '' // assign different colors for push / pull points
    };
  }

  public checkIfMouseOnCircles(
    event: MouseEvent | PointerEvent | WheelEvent,
    p: Array<NormalizedPoint>
  ): boolean {
    return this.getHoveredCircles(event, p).length > 0;
  }

  public deleteNormalizedPoints(
    event: MouseEvent | PointerEvent,
    p: Array<NormalizedPoint>
  ): Array<NormalizedPoint> {
    const indices = this.getHoveredCircles(event, p);

    return p.filter((item) => !indices.includes(item.index));
  }

  public getHoveredCircles(
    event: MouseEvent | PointerEvent | WheelEvent,
    p: Array<NormalizedPoint>
  ): Array<number> {
    const indices: Array<number> = [];

    // don't mess up with the order: first remains first point; adding on top; deleting in-place
    p.forEach((point) => {
      if (this.isEventOnCircle(event, point)) {
        indices.push(point.index);
      }
    });

    return indices;
  }

  public isEventOnCircle(
    event: MouseEvent | PointerEvent | WheelEvent,
    point: NormalizedPoint
  ): boolean {
    if (this.ctx === undefined) {
      return false;
    }
    // de-normalization
    // TODO use function this.circleDtoFromNormalizedPoint to handle this !
    const xDiff = (point.x * this.ctx.canvas.width) - event.x;
    const yDiff = (point.y * this.ctx.canvas.height) - event.y;
    const radius
      = this.configurationService.getCircleSize().min + Math.abs(point.z);

    // calculate distance from point center to pointer position with Pythagoras (in px, because 'z' can hardly be normalized)
    const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    const isOnCircle = distance < radius;

    return isOnCircle;
  }

  public movePointFromEvent(
    event1: MouseEvent | PointerEvent,
    event2: MouseEvent | PointerEvent,
    index: number,
    p: Array<NormalizedPoint>
  ): Array<NormalizedPoint> {
    // TODO use function this.circleDtofromNormalizedPoint for cleaner code here !
    // incremental differences in movement
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

  public normalizedPointFromEvent(
    { target, offsetX, offsetY }: MouseEvent | PointerEvent,
    index: number
  ): NormalizedPoint {
    return {
      x: offsetX / (target as HTMLElement).clientWidth,
      y: offsetY / (target as HTMLElement).clientHeight,
      time: Date.now(),
      index,
      z: 0
    };
  }

  public resizeNormalizedPoints(
    event: WheelEvent,
    p: Array<NormalizedPoint>
  ): Array<NormalizedPoint> {
    // 1: move up; -1: move down
    const mouseDirection = event.deltaY < 0 ? -1 : 1;

    // check if there are more push / pull layers (to define "1" for zvalue normalization)
    const maxAmountLayers = Math.max(
      this.layers?.up ?? 0,
      this.layers?.down ?? 0
    );

    // ...and set normalized z resizing limits based on that
    const normalizedPullLimit = (this.layers?.up ?? 0) / maxAmountLayers;
    const normalizedPushLimit
      = ((this.layers?.down ?? 0) / maxAmountLayers) * -1;

    // speed up scaling with steps of either -/+ 0.05
    // hardcoded value can be changed, turned out to be a good choice when testing
    let { scaleStep } = environment;
    scaleStep *= mouseDirection;

    // actual resizing
    p.forEach((point) => {
      if (this.isEventOnCircle(event, point)) {
        point.z = Math.min(
          Math.max(normalizedPushLimit, point.z + scaleStep),
          normalizedPullLimit
        );
      }
    });

    return p;
  }

  public sliceToMax(
    maxAmount: number,
    p: Array<NormalizedPoint>
  ): Array<NormalizedPoint> {
    return p.slice(-maxAmount);
  }

  public touchPointFromNormalizedPoint(p: NormalizedPoint): Interaction {
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
}
