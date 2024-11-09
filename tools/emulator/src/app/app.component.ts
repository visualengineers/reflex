import { Component } from '@angular/core';
import { CAMERAS } from 'src/app/data/cameras';
import { faTools, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { GestureReplayService } from './service/gesture-replay.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

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


  public constructor(private readonly replayService: GestureReplayService) {
    // replayService.init('assets/data/sampleGesture.json');

  }

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
