import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { CommonModule } from '@angular/common';
import { GestureDataService } from '../service/gesture-data.service';
import { GestureReplayService } from '../service/gesture-replay.service';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { GestureTrack } from '../data/gesture-track';

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
  selector: 'app-new-timeline',
  standalone: true,
  imports: [PlotlyModule, HttpClientModule, CommonModule],
  templateUrl: './new-timeline.component.html',
  styleUrls: ['./new-timeline.component.scss']
})
export class NewTimelineComponent implements OnInit {
  public max_value_layer = 4;
  public min_value_layer = -4;
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
        t: 0,
        b: 0,
        l: 0,
        r: 0
      },
      yaxis: {
        range: [this.min_value_layer, this.max_value_layer],
        tick0: 0,
        dtick: 1,
        showgrid: true,
        gridcolor: '#bdbdbd',
        gridwidth: 1
      },
      xaxis: {
        title: 'Frame',
        range: [0, 0],
        tick0: 0,
        dtick: 1,
        showgrid: false,
        gridcolor: '#bdbdbd',
        gridwidth: 1
      },
      shapes: [] as any,  // Add shapes for alternating color bands
      showlegend: false,
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
    this.segmentsCount = this.gestureService.getGestureNumFrames(); // Get the number of segments from the GestureDataService
    this.segmentWidth = this.graph.layout.width / this.segmentsCount;
    this.segments = Array.from({ length: this.segmentsCount }, (_, i) => i);

    const frameValues = Array.from({ length: this.segmentsCount }, (_, i) => i); // Initialize frameValues array with the number of segments
    const zValues = Array(this.segmentsCount).fill(0); // Initialize zValues array with the number of segments, all set to 0

    this.graph.data = [
      {
        x: frameValues,
        y: zValues,
        type: 'scatter',
        mode: 'markers',
        name: 'Z-Werte',
        marker: { color: 'blue', size: 10 },
        customdata: [],
        hovertemplate: 'Koordinaten: %{customdata}<extra></extra>'
      }
    ];

    // Add alternating background color bands
    for (let i = 0; i < this.segmentsCount; i++) {
      (this.graph.layout.shapes as any).push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: i - 0.5,
        y0: 0,
        x1: i + 0.5,
        y1: 1,
        fillcolor: i % 2 === 0 ? '#e6e6e6' : '#ffffff',
        opacity: 0.5,
        line: {
          width: 0
        }
      });
    }

    this.graph.layout.xaxis.range = [0, this.segmentsCount - 1]; // Set the xaxis.range property based on the number of segments

    this.gestureService.gesturePoints$.subscribe(points => {
      this.updateGraph(points);
    });
  }


  updateGraph(points: GestureTrackFrame[]) {
    const frameValues = Array.from({ length: points.length }, (_, i) => i);
    const zValues = points.map(point => point.z * (this.max_value_layer + this.min_value_layer / 2));

    this.graph.data = [
      {
        x: frameValues,
        y: zValues,
        type: 'scatter',
        mode: 'markers',
        name: 'Z-Werte',
        marker: { color: 'blue', size: 10 },
        customdata: points.map(point => `(${point.x}, ${point.y}, ${point.z})`),
        hovertemplate: 'Koordinaten: %{customdata}<extra></extra>'
      }
    ];

    this.graph.layout.xaxis.range = [-0.5, points.length - 0.5]; // Adjust the xaxis.range property to align the coordinate origin to the left side of the timeline
    this.segmentsCount = points.length;
    this.segmentWidth = this.graph.layout.width / this.segmentsCount;
    this.segments = Array.from({ length: this.segmentsCount }, (_, i) => i);

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
        fillcolor: i % 2 === 0 ? '#e6e6e6' : '#ffffff',
        opacity: 0.5,
        line: {
          width: 0
        }
      });
    }
  }

  updateHorizontalPosition(index: number) {
    this.horizontalPosition = (index + 0.5) * this.segmentWidth;
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
