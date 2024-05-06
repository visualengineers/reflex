import { Component } from "@angular/core";
import { TimelineCanvasComponent } from "./timeline-canvas/timeline-canvas.component";

@Component({
  selector: "app-timeline",
  standalone: true,
  imports: [TimelineCanvasComponent],
  templateUrl: "./timeline.component.html",
  styleUrl: "./timeline.component.scss",
})
export class TimelineComponent {
  public isCollapsed = false;

  constructor() {}

  toggleTimeline(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
