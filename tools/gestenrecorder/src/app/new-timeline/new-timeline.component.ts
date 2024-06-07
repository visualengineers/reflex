import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { CommonModule } from '@angular/common';

PlotlyModule.plotlyjs = PlotlyJS;

interface Frame {
  x: number;
  y: number;
  z: number;
}

interface Track {
  touchId: number;
  frames: Frame[];
}

interface Gesture {
  id: number;
  name: string;
  numFrames: number;
  speed: number;
  tracks: Track[];
}

@Component({
  selector: 'app-new-timeline',
  standalone: true,
  imports: [PlotlyModule, HttpClientModule, CommonModule],
  templateUrl: './new-timeline.component.html',
  styleUrl: './new-timeline.component.scss'
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
      //title: 'Zeitleiste',
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
        range: [(0-0.5), (24-0.5)],
        tick0: 0,
        dtick: 1,
        showgrid: false,
        gridcolor: '#bdbdbd',
        gridwidth: 1
      },
      showlegend: false,
    },
    config: {
      displayModeBar: false,
      staticPlot: true
    }
  };

  constructor(private http: HttpClient) {}

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
      this.http.get<Gesture>('assets/data/sampleGesture.json').subscribe(data => {
        const frames = data.tracks[0].frames;
        
        const numFrames = data.numFrames;
  
        const frameIndices = Array.from({ length: numFrames }, (_, i) => i);
  
        const normalizeAndRound = (z: number, min: number, max: number) => {
          const normalized = ((z + 1) / 2) * (max - min) + min;
          return Math.round(normalized);
        };
        const normalizedframes = frames.map(frame => ({
          ...frame,
          z: normalizeAndRound(frame.z, this.min_value_layer, this.max_value_layer)
        }));
  
        const zValues = normalizedframes.map(frame => frame.z);
  
        console.log('Frame Indices:', frameIndices);
        console.log('Z Values:', zValues);
  
        this.graph.data = [
          {
            x: frameIndices,
            y: zValues,
            type: 'scatter',
            mode: 'markers',
            name: 'Z-Werte',
            marker: { color: 'blue', size: 10 },
            customdata: normalizedframes.map(frame => `(${frame.x}, ${frame.y}, ${frame.z})`),
            hovertemplate: 'Koordinaten: %{customdata}<extra></extra>'
          }
        ];
        this.segmentsCount = zValues.length;
        console.log('segmentsCount', this.segmentsCount);
        resolve();
      }, error => {
        reject(error);
      });
    });
  }
  
  updateHorizontalPosition(index: number) {
    this.horizontalPosition = (index + 0.5) * this.segmentWidth;
    console.log('horizontalPosition', this.horizontalPosition)
    this.updateVerticalLinePosition();
  }

  updateVerticalLinePosition() {
    const container = document.getElementById('graph-container');
    if (container) {
      const plotlyGraph = container.querySelector('.overlay');
      const verticalLine = container.querySelector('.vertical-line');
  
      if (plotlyGraph instanceof HTMLElement && verticalLine instanceof HTMLElement) {
        console.log("verticalLine.style.left", verticalLine.style.left)
        const plotlyGraphRect = plotlyGraph.getBoundingClientRect();
        const plotlyGraphLeft = plotlyGraphRect.left;
        const plotlyGraphWidth = plotlyGraphRect.width;
        const verticalLineLeft = plotlyGraphLeft + this.horizontalPosition-3; // TODO: Berrechnung der Position der roten Strichs optimieren
        verticalLine.style.left = `${verticalLineLeft}px`;
        console.log(plotlyGraphLeft,"+",this.horizontalPosition, "/", this.graph.layout.xaxis.dtick, "*", plotlyGraphWidth, "=", verticalLineLeft)
      }
    }
  }
}
