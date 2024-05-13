import { Component } from '@angular/core';
import { TimelineComponent } from '../timeline/timeline.component';
import { TrackComponentComponent } from '../track-component/track-component.component';

@Component({
  selector: 'app-pullup',
  standalone: true,
  imports: [TimelineComponent,TrackComponentComponent],
  templateUrl: './pullup.component.html',
  styleUrl: './pullup.component.scss'
})
export class PullupComponent {

}
