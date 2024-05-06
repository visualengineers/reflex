import { Component } from "@angular/core";
import { TimelineCanvasComponent } from "./timeline-canvas/timeline-canvas.component";
import { ConfigurationService } from "../service/configuration.service";
import { ConnectionService } from "../service/connection.service";

@Component({
  selector: "app-timeline",
  standalone: true,
  imports: [TimelineCanvasComponent],
  templateUrl: "./timeline.component.html",
  styleUrl: "./timeline.component.scss",
})
export class TimelineComponent {
  public isCollapsed = false;

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService,
  ) {}

  toggleTimeline(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
