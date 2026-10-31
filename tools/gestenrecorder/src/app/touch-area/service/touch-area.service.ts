import { Injectable, inject } from '@angular/core';
import { ExtremumType, Interaction } from '@reflex/shared-types';
import { environment } from '../../../environments/environment';
import { NormalizedPoint } from '../../model/NormalizedPoint.model';
import {
  ConfigurationService,
  Layers
} from '../../service/configuration.service';
import { CircleDto } from '../../shapes/Circle';

@Injectable({
  providedIn: 'root'
})
export class TouchAreaService {
  private readonly configurationService = inject(ConfigurationService);

  // TODO: document all methods in this service
  public addNormalizedPoint(
    point: NormalizedPoint,
    p: Array<NormalizedPoint>,
    maxAmount: number
  ): Array<NormalizedPoint> {
    p.push(point);

    return this.sliceToMax(maxAmount, p);
  }

  public circleDtoFromNormalizedPoint(
    p: NormalizedPoint,
    canvasSize: { width: number; height: number },
    layers?: Layers
  ): CircleDto {
    const circleSize = this.configurationService.getCircleSize();

    return {
      posX: p.x * canvasSize.width,
      posY: p.y * canvasSize.height,
      radius: (Math.abs(p.z) * circleSize.max) + circleSize.min,
      color:
        Math.sign(p.z) > 0 ? layers?.colorUp ?? '' : layers?.colorDown ?? ''
    };
  }

  public checkIfMouseOnCircles(
    event: MouseEvent | PointerEvent | WheelEvent,
    p: Array<NormalizedPoint>,
    ctx: CanvasRenderingContext2D
  ): boolean {
    return this.getHoveredCircles(event, p, ctx).length > 0;
  }

  public deleteNormalizedPoints(
    event: MouseEvent | PointerEvent,
    p: Array<NormalizedPoint>,
    ctx: CanvasRenderingContext2D
  ): Array<NormalizedPoint> {
    const indices = this.getHoveredCircles(event, p, ctx);

    return p.filter((item) => !indices.includes(item.index));
  }

  public getHoveredCircles(
    event: MouseEvent | PointerEvent | WheelEvent,
    p: Array<NormalizedPoint>,
    ctx: CanvasRenderingContext2D
  ): Array<number> {
    const indices: Array<number> = [];
    p.forEach((point) => {
      if (this.isEventOnCircle(event, point, ctx)) {
        indices.push(point.index);
      }
    });

    return indices;
  }

  public isEventOnCircle(
    event: MouseEvent | PointerEvent | WheelEvent,
    point: NormalizedPoint,
    ctx: CanvasRenderingContext2D
  ): boolean {
    const rect = ctx.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const xDiff = (point.x * ctx.canvas.width) - mouseX;
    const yDiff = (point.y * ctx.canvas.height) - mouseY;
    const radius
      = this.configurationService.getCircleSize().min + Math.abs(point.z);
    const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));

    return distance < radius;
  }

  public movePointFromEvent(
    event1: MouseEvent | PointerEvent,
    event2: MouseEvent | PointerEvent,
    index: number,
    p: Array<NormalizedPoint>,
    ctx: CanvasRenderingContext2D
  ): Array<NormalizedPoint> {
    const xDiff = event2.x - event1.x;
    const yDiff = event2.y - event1.y;
    p.forEach((point) => {
      if (index === point.index) {
        point.x += xDiff / (ctx.canvas.width ?? 1);
        point.y += yDiff / (ctx.canvas.height ?? 1);
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
    p: Array<NormalizedPoint>,
    ctx: CanvasRenderingContext2D,
    layers?: Layers
  ): Array<NormalizedPoint> {
    const mouseDirection = event.deltaY < 0 ? -1 : 1;
    const maxAmountLayers = Math.max(layers?.up ?? 0, layers?.down ?? 0);
    const normalizedPullLimit = (layers?.up ?? 0) / maxAmountLayers;
    const normalizedPushLimit = ((layers?.down ?? 0) / maxAmountLayers) * -1;
    let { scaleStep } = environment;
    scaleStep *= mouseDirection;
    p.forEach((point) => {
      if (this.isEventOnCircle(event, point, ctx)) {
        point.z = Math.min(
          Math.max(normalizedPushLimit, point.z + scaleStep),
          normalizedPullLimit
        );
      }
    });

    return p;
  }

  public sliceToMax(maxAmount: number, p: Array<NormalizedPoint>): Array<NormalizedPoint> {
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
