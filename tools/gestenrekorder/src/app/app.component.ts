import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TouchAreaComponent } from "./touch-area/touch-area.component";
import { TimelineComponent } from "./timeline/timeline.component";
import { MenubarComponent } from "./menubar/menubar.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, TouchAreaComponent, TimelineComponent, MenubarComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "gestenrekorder";
}
