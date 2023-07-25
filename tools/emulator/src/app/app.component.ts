import { Component } from '@angular/core';
import { CAMERAS } from 'src/app/data/cameras';
import { faTools, faQuestion } from '@fortawesome/free-solid-svg-icons';

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
  title = 'reflex-emulator';
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
