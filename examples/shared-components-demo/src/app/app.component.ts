import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PanelHeaderComponent, SettingsGroupComponent } from '@reflex/angular-components/dist';
import { ColorComponent } from './color/color.component';
import { CommonModule} from '@angular/common';
import { IntroductionComponent } from './introduction/introduction.component';
import { PanelComponent } from './controls/panel/panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IntroductionComponent,
    PanelComponent,
    CommonModule,
    RouterOutlet,
    SettingsGroupComponent,
    PanelHeaderComponent,
    ColorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public title = 'ReFlex Shared Components Demo';

  public version = '1.0.0';


}
