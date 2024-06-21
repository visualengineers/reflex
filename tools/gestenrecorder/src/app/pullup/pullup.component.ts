import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from '../timeline/timeline.component';
import { TrackComponentComponent } from '../track-component/track-component.component';
import { NewTimelineComponent } from '../new-timeline/new-timeline.component';
@Component({
  selector: 'app-pullup',
  standalone: true,
  imports: [CommonModule,TimelineComponent,TrackComponentComponent, NewTimelineComponent],
  templateUrl: './pullup.component.html',
  styleUrl: './pullup.component.scss'
})
export class PullupComponent {
  isPullupOpen: boolean = true;

  togglePullup() {
    this.isPullupOpen = !this.isPullupOpen;
  }

  closePullup() {
    this.isPullupOpen = false;
  }
}

