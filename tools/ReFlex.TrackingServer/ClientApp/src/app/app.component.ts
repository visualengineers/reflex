import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavMenuComponent } from './nav-menu/nav-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    RouterModule,
    NavMenuComponent
  ]
})
export class AppComponent {
  public title = 'ReFlex TrackingServer';
}
