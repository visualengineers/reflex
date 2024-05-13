import { ElementRef } from "@angular/core";
import { OnDestroy } from "@angular/core";
import { ViewChild } from "@angular/core";
import { Component, OnInit, Inject } from "@angular/core";
import { combineLatest, fromEvent, Subscription } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  publishBehavior,
  refCount,
} from "rxjs/operators";
import {
  ConfigurationService,
  Layers,
} from "../../service/configuration.service";
import { ConnectionService } from "../../service/connection.service";
import { NormalizedPoint } from "../../model/NormalizedPoint.model";
import { CircleDto, CircleRenderer } from "../../shapes/Circle";
import { CommonModule, DOCUMENT } from "@angular/common";

interface Size {
  width: number;
  height: number;
}

@Component({
  selector: "app-timeline-canvas",
  standalone: true,
  imports: [],
  templateUrl: "./timeline-canvas.component.html",
  styleUrl: "./timeline-canvas.component.scss",
})
export class TimelineCanvasComponent implements OnInit, OnDestroy {
  @ViewChild("timeline", { static: true })
  canvas?: ElementRef<HTMLCanvasElement>;

  private ctx?: CanvasRenderingContext2D;
  private circleRenderer?: CircleRenderer;
  private layers?: Layers;
  private points?: CircleDto[];
  private timelineElement?: HTMLElement | null;
  private drawTimelineSubscription?: Subscription;
  private layersSubscription?: Subscription;
  private pointsSubscription?: Subscription;
  private timelineSubscription?: Subscription;
  private readonly localStorage;

  constructor(
    private connectionService: ConnectionService,
    private configurationService: ConfigurationService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.localStorage = document.defaultView?.localStorage;
  }

  ngOnInit(): void {
    if (this.canvas?.nativeElement === undefined) {
      return;
    }

    //this.ctx = this.canvas.nativeElement.getContext(
    //  "2d",
    //) as CanvasRenderingContext2D;
    //this.circleRenderer = new CircleRenderer(
    //  this.ctx,
    //  this.configurationService,
    //);
    this.timelineElement = document.getElementById("timeline-wrapper");

    if (this.timelineElement === null || this.timelineElement === undefined) {
      return;
    }

    const timelineSize$ = fromEvent(this.timelineElement, "resize").pipe(
      map(
        () =>
          ({
            width: this.timelineElement?.offsetWidth ?? 0,
            height: this.timelineElement?.offsetHeight ?? 0,
          }) as Size,
      ),
      distinctUntilChanged(
        (a, b) => a.width === b.width && a.height === b.height,
      ),
      debounceTime(50),
      publishBehavior({
        width: this.timelineElement.offsetWidth,
        height: this.timelineElement.offsetWidth,
      } as Size),
      refCount(),
    );

    // points
    const points$ = combineLatest([
      this.configurationService.getNormalizedPoints(),
      timelineSize$,
    ]).pipe(
      map(([points]) =>
        points.map((p) => this.circleDtoFromNormalizedPoint(p)),
      ),
    );
    this.pointsSubscription = points$.subscribe((p) => (this.points = p));

    // layers
    const layers$ = this.configurationService.getLayers();
    this.layersSubscription = layers$.subscribe((l) => (this.layers = l));

    this.drawTimelineSubscription = combineLatest([
      timelineSize$,
      layers$,
      points$,
    ])
      .pipe(debounceTime(200))
      .subscribe(() => this.drawTimeline());
    this.drawTimeline();
  }

  private drawTimeline(): void {
    if (
      this.canvas?.nativeElement === undefined ||
      this.ctx === undefined ||
      this.timelineElement === null ||
      this.timelineElement === undefined
    ) {
      return;
    }

    const amountLayers = (this.layers?.up ?? 0) + (this.layers?.down ?? 0); // total amount of layers

    // 'fixed layer height' approach for timeline sizing, scroll on overflow
    // layerDepth = 15;
    // this.canvas.nativeElement.width = 3000; // replace with timespan mapped to pixels
    // this.canvas.nativeElement.height = layerDepth * amountLayers;

    // alternative 'zoom fit' approach for timeline sizing:
    this.canvas.nativeElement.width = this.timelineElement.offsetWidth;
    this.canvas.nativeElement.height = this.timelineElement.offsetHeight;
    const layerDepth = this.ctx.canvas.height / amountLayers; // height of a single layer in px

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // layers in alternating colors
    for (let i = 0; i < amountLayers; i++) {
      if (i % 2) {
        this.ctx.fillStyle = "#363636";
      } else {
        this.ctx.fillStyle = "#414141";
      }
      this.ctx.fillRect(
        0,
        i * layerDepth,
        this.ctx.canvas.width,
        (i + 1) * layerDepth,
      );
      this.ctx.fill();
    }

    // idle state line
    this.ctx.strokeStyle = "#888888";
    this.ctx.lineWidth = 2.0;
    this.ctx.beginPath();
    this.ctx.moveTo(0, (this.layers?.up ?? 0) * layerDepth);
    this.ctx.lineTo(this.ctx.canvas.width, (this.layers?.up ?? 0) * layerDepth);
    this.ctx.stroke();

    // points
    this.points?.forEach((points) =>
      this.circleRenderer?.drawOnTimeline(points),
    );
  }

  private circleDtoFromNormalizedPoint(p: NormalizedPoint): CircleDto {
    const amountLayers = (this.layers?.up ?? 0) + (this.layers?.down ?? 0);
    const lDepthPx = (this.ctx?.canvas?.height ?? 0) / amountLayers; // height (px) of a single layer drawn on timeline
    const minLayers = Math.min(this.layers?.up ?? 0, this.layers?.down ?? 0);
    const maxLayers = Math.max(this.layers?.up ?? 0, this.layers?.down ?? 0);
    const normHeight = 1 + minLayers / maxLayers; // always between 1.0 to 2.0. map this to timeline px height
    const normPushLimit = (this.layers?.down ?? 0) / amountLayers;
    const normLDepth = normHeight / amountLayers;
    const normY = normHeight - (normPushLimit + p.z);

    const layer = Math.min(
      Math.max(Math.floor(normY / normLDepth), 0),
      amountLayers,
    );

    return {
      posX: lDepthPx / 2,
      posY: layer * lDepthPx - lDepthPx / 2,
      radius: lDepthPx / 2,
      color:
        Math.sign(p.z) > 0
          ? this.layers?.colorUp ?? ""
          : this.layers?.colorDown ?? "",
    };
  }

  ngOnDestroy(): void {
    this.drawTimelineSubscription?.unsubscribe();
    this.layersSubscription?.unsubscribe();
    this.pointsSubscription?.unsubscribe();
  }
}
