import { Component, inject } from '@angular/core';
import { CAMERAS } from 'src/app/data/cameras';
import { faTools, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { GestureReplayService } from './service/gesture-replay.service';
import { CanvasComponent } from './canvas/canvas.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TimelineComponent } from './timeline/timeline.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  imports: [CanvasComponent, SidebarComponent, TimelineComponent, RouterOutlet],
})
export class AppComponent {
  private readonly replayService = inject(GestureReplayService);

  show = '';
  cameras = CAMERAS;
  faTools = faTools;
  faQuestion = faQuestion;
  title = 'ReFlex | Emulator';
  valueEmittedFromChildComponent = '';
  msgFaq = 'faq';
  msgSettings = 'settings';
  showFaq = false;
  showSettings = false;

  clickHandler(clickMsg: string) {
    if (clickMsg === 'faq') {
      this.showFaq = !this.showFaq;
      this.showSettings = false;
    }
    if (clickMsg === 'settings') {
      this.showSettings = !this.showSettings;
      this.showFaq = false;
    }
  }
}
