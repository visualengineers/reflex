import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlotlyModule } from 'angular-plotly.js';
import * as plotlyJS from 'plotly.js-dist-min';
import { Shape } from 'plotly.js-dist-min';
const PAPER_BACKGROUND = 'paper_bgcolor';
const PLOT_BACKGROUND = 'plot_bgcolor';

import { GestureTrackFrame } from '../data/gesture-track-frame';
import { GestureDataService } from '../service/gesture-data.service';
import { GestureReplayService } from '../service/gesture-replay.service';

PlotlyModule.plotlyjs = plotlyJS;

@Component({
  selector: 'app-timeline',
  imports: [PlotlyModule],
  templateUrl: './timeline.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {

  public maxValueLayer = 1;
  public minValueLayer = -1.2;
  public horizontalPosition = 0;

  public segmentsCount = 0;
  public segmentWidth = 0;
  public segments: Array<unknown> = [];

  public graph = {
    data: [] as Array<unknown>,
    layout: {
      width: 800,
      height: 200,
      margin: {
        t: 20,
        b: 40,
        l: 60,
        r: 20
      },
      yaxis: {
        range: [this.minValueLayer, this.maxValueLayer],
        tick0: 0,
        dtick: 1,
        showgrid: true,
        gridcolor: '#bdbdbd',
        gridwidth: 1,
        title: 'Tiefe | Höhe'
      },
      xaxis: {
        title: 'Frame',
        range: [0, 0],
        tick0: 0,
        dtick: 1,
        showgrid: false,
        gridcolor: '#bdbdbd',
        gridwidth: 1,
        titlefont: {
          size: 14,
          color: '#333'
        }
      },
      shapes: [] as Array<Partial<Shape>>,
      showlegend: false,
      [PAPER_BACKGROUND]: '#f9f9f9',
      [PLOT_BACKGROUND]: '#fff'
    },
    config: {
      displayModeBar: false,
      staticPlot: true
    }
  };

  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly gestureService = inject(GestureDataService);
  private readonly gestureReplayService = inject(GestureReplayService);

  public constructor() {
    this.graph.layout.xaxis.range = [0, this.gestureService.getGestureNumFrames()];
  }

  public ngOnInit(): void {
    this.gestureService.gesture$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((gesture) => {
        this.segmentsCount = gesture.numFrames;
        this.segmentWidth = this.graph.layout.width / this.segmentsCount;
        this.segments = Array.from({ length: this.segmentsCount }, (value, i) => i);

        // Update the xaxis.range property
        this.graph.layout.xaxis.range = [0, this.segmentsCount];

        // Update the graph with empty data
        this.updateGraph([]);
      });

    this.gestureService.gesturePoints$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((points) => {
        this.updateGraph(points);
      });
  }

  public updateGraph(points: Array<GestureTrackFrame>): void {
    this.changeDetector.markForCheck();
    const frameValues = Array.from({ length: this.segmentsCount }, (value, i) => i);
    const zValues = points.map((point) => point.z);

    // Set the xaxis.range property to start from 0
    this.graph.layout.xaxis.range = [-0.5, this.segmentsCount];

    this.graph.data = [
      {
        x: frameValues,
        y: zValues,
        type: 'scatter',
        mode: 'markers',
        name: 'Z-Werte',
        marker: { color: 'blue', size: 10 },
        customdata: points.map(
          (point) => `(${point.x}, ${point.y}, ${point.z})`
        ),
        hovertemplate: 'Koordinaten: %{customdata}<extra></extra>',
        zindex: 2
      }
    ];

    // Update the background color bands
    this.graph.layout.shapes = [];
    for (let i = 0; i < this.segmentsCount; i++) {
      this.graph.layout.shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: i - 0.5,
        y0: 0,
        x1: i + 0.5,
        y1: 1,
        fillcolor: i % 2 === 0 ? '#ffffff' : '#e6e6e6',
        opacity: 0.5,
        line: {
          width: 0
        },
        layer: 'below'
      });
    }
  }

  public updateHorizontalPosition(index: number): void {
    this.horizontalPosition = index * this.segmentWidth;
    this.updateVerticalLinePosition();
  }

  public updateVerticalLinePosition(): void {
    const container = document.getElementById('graph-container');
    if (container) {
      const plotlyGraph = container.querySelector('.overlay');
      const verticalLine = container.querySelector('.vertical-line');

      if (
        plotlyGraph instanceof HTMLElement
        && verticalLine instanceof HTMLElement
      ) {
        const plotlyGraphRect = plotlyGraph.getBoundingClientRect();
        const plotlyGraphLeft = plotlyGraphRect.left;
        const verticalLineLeft = plotlyGraphLeft + this.horizontalPosition - 3;
        verticalLine.style.left = `${verticalLineLeft}px`;
      }
    }
  }
}
