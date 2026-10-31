import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { TimelineComponent } from '../timeline/timeline.component';
import { TrackComponentComponent } from '../track-component/track-component.component';
@Component({
  selector: 'app-pullup',
  imports: [CommonModule, TrackComponentComponent, TimelineComponent],
  templateUrl: './pullup.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pullup.component.scss'
})
export class PullupComponent {
  public isPullupOpen = true;

  public togglePullup(): void {
    this.isPullupOpen = !this.isPullupOpen;
  }

  public closePullup(): void {
    this.isPullupOpen = false;
  }
}
