import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TouchAreaComponent } from "./touch-area/touch-area.component";
import { TimelineComponent } from "./timeline/timeline.component";
import { TrackComponentComponent } from "./track-component/track-component.component";
import { OverlayComponent } from "./overlay/overlay.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet,TouchAreaComponent,TimelineComponent,TrackComponentComponent,OverlayComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "gestenrekorder";
}
