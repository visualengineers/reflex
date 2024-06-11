import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { CommonModule } from '@angular/common';
import { GestureDataService } from '../service/gesture-data.service';

PlotlyModule.plotlyjs = PlotlyJS;

interface Frame {
  x: number;
  y: number;
  z: number;
}

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
        range: [-0.5, 23.5],
        tick0: 0,
        dtick: 1,
        showgrid: false,
        gridcolor: '#bdbdbd',
        gridwidth: 1
      },
      showlegend: false
    },
    config: {
      displayModeBar: false,
      staticPlot: true
    }
  };

  constructor(
    private gestureDataService: GestureDataService,
    http: HttpClient
  ) {}

  ngOnInit() {
    this.loadGestureData().then(() => {
      console.log('segmentsCount', this.segmentsCount);
      this.segmentWidth = this.graph.layout.width / this.segmentsCount;
      for (let i = 0; i < this.segmentsCount; i++) {
        this.segments.push(i);
      }
    });
  }

  loadGestureData(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.gestureDataService.gestures$.subscribe(data => {
        if (data.length > 0) {
          const gesture = data[0];
          const { frameIndices, zValues, normalizedFrames } = this.gestureDataService.processGestureData(gesture, this.min_value_layer, this.max_value_layer);

          console.log('Frame Indices:', frameIndices);
          console.log('Z Values:', zValues);

          this.graph.data = [
            {
              x: frameIndices,
              y: zValues,
              type: 'scatter',
              mode: 'markers',
              name: 'z-Werte',
              marker: { color: 'blue', size: 10 },
              customdata: normalizedFrames.map((frame: Frame) => `(${frame.x}, ${frame.y}, ${frame.z})`),
              hovertemplate: 'Koordinaten: %{customdata}<extra></extra>'
            }
          ];
          this.segmentsCount = zValues.length;
          console.log('segmentsCount', this.segmentsCount);
          resolve();
        } else {
          reject('No gesture data available');
        }
      }, error => {
        reject(error);
      });

      this.gestureDataService.loadGestures();
    });
  }

  updateHorizontalPosition(index: number) {
    this.horizontalPosition = (index + 0.5) * this.segmentWidth;
    console.log('horizontalPosition', this.horizontalPosition);
    this.updateVerticalLinePosition();
  }

  updateVerticalLinePosition() {
    const container = document.getElementById('graph-container');
    if (container) {
      const plotlyGraph = container.querySelector('.overlay');
      const verticalLine = container.querySelector('.vertical-line');

      if (plotlyGraph instanceof HTMLElement && verticalLine instanceof HTMLElement) {
        console.log("verticalLine.style.left", verticalLine.style.left);
        const plotlyGraphRect = plotlyGraph.getBoundingClientRect();
        const plotlyGraphLeft = plotlyGraphRect.left;
        const plotlyGraphWidth = plotlyGraphRect.width;
        const verticalLineLeft = plotlyGraphLeft + this.horizontalPosition - 3; // TODO: Berechnung der Position des roten Strichs optimieren
        verticalLine.style.left = `${verticalLineLeft}px`;
        console.log(plotlyGraphLeft, "+", this.horizontalPosition, "/", this.graph.layout.xaxis.dtick, "*", plotlyGraphWidth, "=", verticalLineLeft);
      }
    }
  }

  isPlaying: boolean = false;

  playGesture() {
    this.isPlaying = true;
    console.log('PLAY');
  }

  stopPlayingGesture() {
    this.isPlaying = false;
    console.log('STOP');
  }

  resetPlayback() {
    console.log('RESET');
  }
}
