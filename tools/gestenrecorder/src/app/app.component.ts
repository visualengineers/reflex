import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  OptionCheckboxComponent,
  SettingsGroupComponent
} from '@reflex/angular-components/dist';
import { DropdownComponent } from './dropdown/dropdown.component';
import { PullupComponent } from './pullup/pullup.component';
import { GestureDataService } from './service/gesture-data.service';
import { GestureReplayService } from './service/gesture-replay.service';
import { TimelineComponent } from './timeline/timeline.component';
import { TouchAreaComponent } from './touch-area/touch-area.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TouchAreaComponent,
    DropdownComponent,
    PullupComponent,
    TimelineComponent,
    OptionCheckboxComponent,
    SettingsGroupComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public title = 'gestenrecorder';
  public toggleLoopActive = true;
  private readonly gestureService = inject(GestureDataService);
  private readonly gestureReplayService = inject(GestureReplayService);

  public buildGesture(): void {
    this.gestureService.interpolateGesture();
  }

  public playGesture(): void {
    if (this.toggleLoopActive) {
      const gesture = this.gestureService.getGesture();
      this.gestureReplayService.initGestureObject(gesture);
    } else {
      const gesture = this.gestureService.getGesture();
      this.gestureReplayService.initGestureObject(gesture);
      this.gestureReplayService.resetAnimationAfterOneLoop();
    }
  }

  public resetGesture(): void {
    this.gestureReplayService.resetAnimation();
  }
}
