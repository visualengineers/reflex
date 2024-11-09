import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackComponentComponent } from '../track-component/track-component.component';
import { TimelineComponent } from '../timeline/timeline.component';
@Component({
  selector: 'app-pullup',
  standalone: true,
  imports: [CommonModule,TrackComponentComponent, TimelineComponent],
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

