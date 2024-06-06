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
})
export class NewTimelineComponent implements OnInit {
  public graph = {
    data: [] as any[],
    layout: {
      width: 800,
      height: 600,
      title: 'Zeitleiste',
      yaxis: {
        title: 'Tiefe  |  Höhe',
        range: [-5, 5]
      },
      xaxis: {
        title: 'Framerate'
      }
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

      const zValues = frames.map(frame => frame.z);

      console.log('Frame Indices:', frameIndices);
      console.log('Z Values:', zValues);

      this.graph.data = [
        {
          x: frameIndices,
          y: zValues,
          type: 'scatter',
          mode: 'markers',
          name: 'Z-Werte',
          marker: { color: 'red', size: 10 }, // Größe der Marker anpassen
          customdata: frames.map(frame => `(${frame.x}, ${frame.y}, ${frame.z})`),
          hovertemplate: 'Koordinaten: %{customdata}<extra></extra>'
        }
      ];

      console.log('Graph data:', this.graph.data);
    });
  }
}
