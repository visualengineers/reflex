import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

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
  imports: [PlotlyModule, HttpClientModule],
  templateUrl: './new-timeline.component.html',
  styleUrl: './new-timeline.component.scss'
})
export class NewTimelineComponent implements OnInit {
  
  public max_value_layer = 4;
  public min_value_layer = -4;

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
        title: 'Tiefe  |  Höhe',
        range: [this.min_value_layer, this.max_value_layer],
        tick0: 0,
        dtick: 1,
        showgrid: true,
        gridcolor: '#bdbdbd',
        gridwidth: 1
      },
      xaxis: {
        title: 'Frame',
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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadGestureData();
  }

  loadGestureData() {
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
          marker: { color: 'blue', size: 10 }, // Farbe der Marker auf blau setzen
          customdata: normalizedframes.map(frame => `(${frame.x}, ${frame.y}, ${frame.z})`),
          hovertemplate: 'Koordinaten: %{customdata}<extra></extra>'
        }
      ];

      console.log('Graph data:', this.graph.data);
    });
  }
}
