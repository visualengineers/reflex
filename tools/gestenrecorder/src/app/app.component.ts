import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TouchAreaComponent } from "./touch-area/touch-area.component";
import { DropdownComponent } from "./dropdown/dropdown.component";
import { PullupComponent } from "./pullup/pullup.component";
import { TimelineComponent } from "./timeline/timeline.component";
import { GestureDataService } from "./service/gesture-data.service";
import { GestureReplayService } from "./service/gesture-replay.service";
import { OptionCheckboxComponent,SettingsGroupComponent } from "@reflex/angular-components/dist";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet,TouchAreaComponent,DropdownComponent,PullupComponent, TimelineComponent, OptionCheckboxComponent, SettingsGroupComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "gestenrecorder";
  public toggleLoopActive = true;

  constructor(
    private gestureService: GestureDataService,
    private gestureReplayService: GestureReplayService,
  ) {}

  buildGesture(): void {
    this.gestureService.interpolateGesture();
  }

  playGesture(): void {
    if(this.toggleLoopActive){
      const gesture = this.gestureService.getGesture();
      this.gestureReplayService.initGestureObject(gesture);
    } else {
      const gesture = this.gestureService.getGesture();
      this.gestureReplayService.initGestureObject(gesture);
      this.gestureReplayService.resetAnimationAfterOneLoop(gesture);
    }

  }

  resetGesture(): void {
    const gesture = this.gestureService.getGesture();
    this.gestureReplayService.resetAnimation(gesture);
  }
}
