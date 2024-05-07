import { Component } from '@angular/core';
import {ConfigurationService} from '../service/configuration.service';
import {ConnectionService} from '../service/connection.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass']
})
export class TimelineComponent {

  public isCollapsed = false;

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService
  ) { }


  toggleTimeline(): void {
    this.isCollapsed = !this.isCollapsed;
  }

}
