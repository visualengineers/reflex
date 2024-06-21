import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TouchAreaComponent } from "./touch-area/touch-area.component";
import { DropdownComponent } from "./dropdown/dropdown.component";
import { PullupComponent } from "./pullup/pullup.component";
import { NewTimelineComponent } from "./new-timeline/new-timeline.component";
import { GestureDataService } from "./service/gesture-data.service";
import { GestureReplayService } from "./service/gesture-replay.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet,TouchAreaComponent,DropdownComponent,PullupComponent, NewTimelineComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "gestenrecorder";

  constructor(
    private gestureService: GestureDataService,
    private gestureReplayService: GestureReplayService,
  ) {}

  buildGesture(): void {
    this.gestureService.interpolateGesture();
  }

  playGesture(): void {
    const gesture = this.gestureService.getGesture();
    this.gestureReplayService.initGestureObject(gesture);
  }

  resetGesture(): void {
    const gesture = this.gestureService.getGesture();
    this.gestureReplayService.resetAnimation(gesture);
  }
}
