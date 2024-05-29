import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TouchAreaComponent } from "./touch-area/touch-area.component";
import { DropdownComponent } from "./dropdown/dropdown.component";
import { PullupComponent } from "./pullup/pullup.component";
import { NewTimelineComponent } from "./new-timeline/new-timeline.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet,TouchAreaComponent,DropdownComponent,PullupComponent, NewTimelineComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "gestenrecorder";
}
