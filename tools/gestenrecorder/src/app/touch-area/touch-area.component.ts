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
import { GestureReplayService } from '../service/gesture-replay.service';
import { NormalizedPoint } from '../model/NormalizedPoint.model';
import { HoverMenuComponent } from '../hover-menu/hover-menu.component';
import { take } from 'rxjs';
import { Gesture } from '../data/gesture';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Size {
  width: number;
  height: number;
}

@Component({
    selector: 'app-touch-area',
    imports: [HoverMenuComponent, CommonModule, FormsModule],
    templateUrl: './touch-area.component.html',
    styleUrls: ['./touch-area.component.scss']
})
export class TouchAreaComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild(HoverMenuComponent) hoverMenu?: HoverMenuComponent;

  public backgroundPath = '';
  private ctx?: CanvasRenderingContext2D;
  private layers?: Layers;
  private subscriptions: Subscription[] = [];
  private circleRenderer?: CircleRenderer;
  private drawnCircleDtos: CircleDto[] = []; // To keep track of drawn circles
  private animatedCircleDto?: CircleDto; // To track the animated circle
  hoveredPoint: NormalizedPoint | null = null;
  menuPosition = { x: 0, y: 0 };
  isHoverMenuFixed: boolean = false;

  constructor(
    private connectionService: ConnectionService,
    private configurationService: ConfigurationService,
    private eventService: EventService,
    private touchAreaService: TouchAreaService,
    private hostElement: ElementRef,
    private gestureService: GestureDataService,
    private gestureReplayService: GestureReplayService,
  ) {}

  ngOnInit(): void {
    if (this.canvas?.nativeElement !== undefined) {
      this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    this.gestureReplayService.playbackFrame$.subscribe((value) => {
      if(value){
        const point: NormalizedPoint = {
          index: 0,
          x: value.x,
          y: value.y,
          z: value.z,
          time: 0
        }
        const dto = this.touchAreaService.circleDtoFromNormalizedPoint(point, { width: this.canvas?.nativeElement.width ?? 0, height: this.canvas?.nativeElement.height ?? 0 }, this.layers);
        this.drawAnimation(dto);
      }
    });

    // this.gestureService.gesture$.subscribe(gesture => {
    //   if (gesture) {
    //     const points: NormalizedPoint[] = [];
    //     gesture.tracks.forEach(track => {
    //       track.frames.map((frame, index) => {
    //         points.push({
    //           index: index,
    //           x: frame.x / this.configurationService.getViewPort().width,
    //           y: frame.y / this.configurationService.getViewPort().height,
    //           z: frame.z,
    //           time: 0
    //         });
    //       });
    //     });
    //     this.configurationService.setNormalizedPoints(points);
    //   }
    // });

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

    const mouseMiddleClick$ = fromEvent<MouseEvent>(this.canvas!.nativeElement, 'mousedown').pipe(
      filter(event => event.button === 1)  // 1 steht für die mittlere Maustaste (Mausrad)
    );

    const mouseHoversCircle$ = combineLatest([mouseMove$, this.configurationService.getNormalizedPoints()]).pipe(
      map(([event, points]) => {
        if (this.hoverMenu?.isFixed) {
          return true; // Wenn das Menü fixiert ist, bleiben wir im Hover-Zustand
        }

        const hoveredCircles = this.touchAreaService.getHoveredCircles(event, points, this.ctx!);
        if (hoveredCircles.length > 0) {
          this.hoveredPoint = points[hoveredCircles[0]];
          this.updateMenuPosition(event);
        } else {
          this.hoveredPoint = null;
        }
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
        console.log("backgroundPath TouchArea:",this.backgroundPath);
      }),

      combineLatest([normalizedPoints$, windowSize$, layers$]).pipe(
        map(([points]) => {
          const newSize = { width: Number(this.hostElement.nativeElement.offsetWidth), height: Number(this.hostElement.nativeElement.offsetHeight) };
          return points.map(p => this.touchAreaService.circleDtoFromNormalizedPoint(p, newSize, this.layers))
        })
      ).subscribe(circleDtos => {
        this.drawnCircleDtos = circleDtos; // Store drawn circles
        this.drawCircleDtos();
      }),

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
      }),

      mouseDown$.pipe(
        filter(event => event.button === 2),
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => {
          const indices = this.touchAreaService.getHoveredCircles(event, points, this.ctx!);
          if (indices.length > 0) {
            const frame = this.gestureService.getGestureTrackFrames()[indices[0]];
            this.gestureService.deleteGestureTrackFrame(frame);
            points.splice(indices[0], 1);
          }
          return points;
        })
      ).subscribe(points => {
        this.configurationService.setNormalizedPoints(points);
        const gestureTrackFrames = points.map(p => this.touchAreaService.touchPointFromNormalizedPoint(p));
        gestureTrackFrames.forEach(gestureTrackFrame => {
          this.gestureService.addGestureTrackFrame(gestureTrackFrame);
        });
      }),

      dragDropMoveLeft$.pipe(
        withLatestFrom(activePointIndex$, normalizedPoints$),
        map(([[event1, event2], index, points]) => {
          const newPoint = this.touchAreaService.movePointFromEvent(event1, event2, index, points, this.ctx!)[index];
          const gestureTrackFrame = this.touchAreaService.touchPointFromNormalizedPoint(newPoint);
          this.gestureService.updateGestureTrackFrame(index, gestureTrackFrame.position.x, gestureTrackFrame.position.y, gestureTrackFrame.position.z);
          points[index] = newPoint;
          return points;
        })
      ).subscribe(points => this.configurationService.setNormalizedPoints(points)),

      mouseWheel$.pipe(
        withLatestFrom(normalizedPoints$),
        map(([event, points]) => this.touchAreaService.resizeNormalizedPoints(event, points, this.ctx!, this.layers))
      ).subscribe(points => {
        this.configurationService.setNormalizedPoints(points);
      }),

      normalizedPoints$.pipe(
        map(points => points.map(p => this.touchAreaService.touchPointFromNormalizedPoint(p)))
      ).subscribe(touchPoints => {
        console.log("TouchPoint an GestureDataService:", touchPoints);
        touchPoints.forEach(point => {
          this.gestureService.addGestureTrackFrame(point);
        });
      }),

      amountTouchPoints$.pipe(
        withLatestFrom(normalizedPoints$),
        map(([amount, points]) => this.touchAreaService.sliceToMax(amount, points))
      ).subscribe(points => this.configurationService.setNormalizedPoints(points)),

      layers$.subscribe(layers => this.layers = layers),

      mouseHoversCircle$.subscribe(),

      mouseMiddleClick$.pipe(
        withLatestFrom(this.configurationService.getNormalizedPoints()),
        filter(([event, points]) => {
          const hoveredCircles = this.touchAreaService.getHoveredCircles(event, points, this.ctx!);
          return hoveredCircles.length > 0;
        })
      ).subscribe(() => {
        this.isHoverMenuFixed = !this.isHoverMenuFixed;
      })
    );
  }

  onPointUpdated(updatedPoint: NormalizedPoint): void {
    this.configurationService.getNormalizedPoints().pipe(
      take(1)
    ).subscribe((currentPoints: NormalizedPoint[]) => {
      const index = currentPoints.findIndex((p: NormalizedPoint) => p.index === updatedPoint.index);
      if (index !== -1) {
        currentPoints[index] = updatedPoint;
        this.configurationService.setNormalizedPoints(currentPoints);

        // Convert NormalizedPoint to TouchPoint
        const touchPoint = this.touchAreaService.touchPointFromNormalizedPoint(updatedPoint);

        // Update the point in the GestureService
        this.gestureService.gesture$.pipe(
          take(1)
        ).subscribe((currentGesture: Gesture) => {
          if (currentGesture && currentGesture.tracks && currentGesture.tracks.length > 0) {
            const frame = currentGesture.tracks[0].frames[index];
            if (frame) {
              frame.x = touchPoint.position.x;
              frame.y = touchPoint.position.y;
              frame.z = touchPoint.position.z;
              this.gestureService.updateGestureTrackFrame(index, frame.x, frame.y, frame.z);
            }
          }
        });

        // Redraw the points
        this.drawCircleDtos();
      }
    });
  }

  private updateMenuPosition(event: MouseEvent): void {
    this.menuPosition = {
      x: event.clientX + 10,
      y: event.clientY + 10
    };
  }

  private drawCircleDtos(): void {
    if (this.ctx === undefined) {
      return;
    }
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.globalAlpha = 0.5;

    // Draw stored circles
    this.drawnCircleDtos.forEach((circleDto, index) => {
      this.circleRenderer?.draw(circleDto);

      // Zeichne den Index in die Mitte des Kreises
      if (this.ctx) {
        this.ctx.globalAlpha = 1; // Text sollte vollständig sichtbar sein
        this.ctx.font = '16px Arial'; // Schriftart und Größe
        this.ctx.fillStyle = 'white'; // Textfarbe
        this.ctx.textAlign = 'center'; // Text zentriert horizontal
        this.ctx.textBaseline = 'middle'; // Text zentriert vertikal

        // Position des Textes (Mittelpunkt des Kreises)
        const textX = circleDto.posX;
        const textY = circleDto.posY;

        // Zeichne den Text
        this.ctx.fillText(index.toString(), textX, textY);
      }

      // Zeichne gestrichelte Linie zum nächsten Punkt
      if (this.ctx) {
        if (index < this.drawnCircleDtos.length - 1) {
          const nextCircleDto = this.drawnCircleDtos[index + 1];
          this.ctx.globalAlpha = 1; // Linie sollte vollständig sichtbar sein
          this.ctx.strokeStyle = 'white'; // Linienfarbe
          this.ctx.lineWidth = 2; // Linienbreite
          this.ctx.setLineDash([5, 5]); // Strichmuster: [Strichlänge, Lückenlänge]

          this.ctx.beginPath();
          this.ctx.moveTo(circleDto.posX, circleDto.posY);
          this.ctx.lineTo(nextCircleDto.posX, nextCircleDto.posY);
          this.ctx.stroke();
          this.ctx.setLineDash([]); // Setzt das Strichmuster zurück
        }
      }
    });

    // Draw the animated circle
    if (this.animatedCircleDto) {
      this.circleRenderer?.draw(this.animatedCircleDto);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.configurationService.amountTouchPoints$.unsubscribe();
    this.configurationService.background$.unsubscribe();
    this.connectionService.disconnect();
  }

  private drawAnimation(dto: CircleDto): void {
    // Update the animated circle DTO
    this.animatedCircleDto = dto;
    this.drawCircleDtos();
  }
}
