import { Component } from "@angular/core";
import { TimelineCanvasComponent } from "./timeline-canvas/timeline-canvas.component";
import { ConfigurationService } from "../services/configuration.service";
import { ConnectionService } from "../services/connection.service";

@Component({
  selector: "app-timeline",
  standalone: true,
  imports: [TimelineCanvasComponent],
  templateUrl: "./timeline.component.html",
  styleUrl: "./timeline.component.scss",
})
export class TimelineComponent {

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService,
  ) {}
}
