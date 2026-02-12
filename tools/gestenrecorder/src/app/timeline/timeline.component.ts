import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { CommonModule } from '@angular/common';
import { GestureDataService } from '../service/gesture-data.service';
import { GestureReplayService } from '../service/gesture-replay.service';
import { GestureTrackFrame } from '../data/gesture-track-frame';

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
    selector: 'app-timeline',
    imports: [PlotlyModule,
       CommonModule],
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
  public max_value_layer = 1;
  public min_value_layer = -1.2;
  public horizontalPosition = 0;

  public segmentsCount = 0;
  public segmentWidth: number = 0;
  public segments: any[] = [];

  public graph = {
    data: [] as any[],
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
        range: [this.min_value_layer, this.max_value_layer],
        tick0: 0,
        dtick: 1,
        showgrid: true,
        gridcolor: '#bdbdbd',
        gridwidth: 1,
        title: 'Tiefe | Höhe'
      },
      xaxis: {
        title: 'Frame',
        range: [0, this.gestureService.getGestureNumFrames],
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
      shapes: [] as any,
      showlegend: false,
      paper_bgcolor: '#f9f9f9',
      plot_bgcolor: '#fff'
    },
    config: {
      displayModeBar: false,
      staticPlot: true
    }
  };

  constructor(
    private http: HttpClient,
    private gestureService: GestureDataService,
    private readonly gestureReplayService: GestureReplayService
  ) {}

  ngOnInit() {
    this.gestureService.gesture$.subscribe(gesture => {
      this.segmentsCount = gesture.numFrames;
      this.segmentWidth = this.graph.layout.width / this.segmentsCount;
      this.segments = Array.from({ length: this.segmentsCount }, (_, i) => i);

      // Update the xaxis.range property
      this.graph.layout.xaxis.range = [0, this.segmentsCount];

      // Update the graph with empty data
      this.updateGraph([]);
    });

    this.gestureService.gesturePoints$.subscribe(points => {
      this.updateGraph(points);
    });
  }

  updateGraph(points: GestureTrackFrame[]) {
    const frameValues = Array.from({ length: this.segmentsCount }, (_, i) => i);
    const zValues = points.map(point => point.z);

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
        customdata: points.map(point => `(${point.x}, ${point.y}, ${point.z})`),
        hovertemplate: 'Koordinaten: %{customdata}<extra></extra>',
        zindex: 2
      }
    ];

    // Update the background color bands
    (this.graph.layout.shapes as any) = [];
    for (let i = 0; i < this.segmentsCount; i++) {
      (this.graph.layout.shapes as any).push({
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
        zindex: 1
      });
    }
  }


  updateHorizontalPosition(index: number) {
    this.horizontalPosition = (index) * this.segmentWidth;
    this.updateVerticalLinePosition();
  }

  updateVerticalLinePosition() {
    const container = document.getElementById('graph-container');
    if (container) {
      const plotlyGraph = container.querySelector('.overlay');
      const verticalLine = container.querySelector('.vertical-line');

      if (plotlyGraph instanceof HTMLElement && verticalLine instanceof HTMLElement) {
        const plotlyGraphRect = plotlyGraph.getBoundingClientRect();
        const plotlyGraphLeft = plotlyGraphRect.left;
        const verticalLineLeft = plotlyGraphLeft + this.horizontalPosition - 3;
        verticalLine.style.left = `${verticalLineLeft}px`;
      }
    }
  }
}
