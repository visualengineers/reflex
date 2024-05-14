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

  constructor(private elementRef: ElementRef) {}

  togglePullup() {
    this.isPullupOpen = !this.isPullupOpen;
    if (this.isPullupOpen) {
      this.addClickOutsideListener();
    } else {
      this.removeClickOutsideListener();
    }
  }

  closePullup() {
    this.isPullupOpen = false;
    this.removeClickOutsideListener();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closePullup();
    }
  }

  addClickOutsideListener() {
    document.addEventListener('click', this.onClickOutside.bind(this));
  }

  removeClickOutsideListener() {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }
}

