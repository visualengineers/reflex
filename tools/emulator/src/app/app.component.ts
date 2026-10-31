import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { faQuestion, faTools } from '@fortawesome/free-solid-svg-icons';
import { CAMERAS } from 'src/app/data/cameras';
import { CanvasComponent } from './canvas/canvas.component';
import { GestureReplayService } from './service/gesture-replay.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TimelineComponent } from './timeline/timeline.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CanvasComponent, SidebarComponent, TimelineComponent, RouterOutlet]
})
export class AppComponent {

  public show = '';
  public cameras = CAMERAS;
  public faTools = faTools;
  public faQuestion = faQuestion;
  public title = 'ReFlex | Emulator';
  public valueEmittedFromChildComponent = '';
  public msgFaq = 'faq';
  public msgSettings = 'settings';
  public showFaq = false;
  public showSettings = false;
  private readonly replayService = inject(GestureReplayService);

  public clickHandler(clickMsg: string): void {
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
