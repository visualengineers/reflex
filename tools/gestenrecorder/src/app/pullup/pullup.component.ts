import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from '../timeline/timeline.component';
import { TrackComponentComponent } from '../track-component/track-component.component';

@Component({
  selector: 'app-pullup',
  standalone: true,
  imports: [CommonModule,TimelineComponent,TrackComponentComponent],
  templateUrl: './pullup.component.html',
  styleUrl: './pullup.component.scss'
})
export class PullupComponent {
  isPullupOpen: boolean = false;
  
  togglePullup() {
    this.isPullupOpen = !this.isPullupOpen;
  }

  closePullup() {
    this.isPullupOpen = false;
  }
}

