import { Component, OnInit } from '@angular/core';
import {ConfigurationService, ViewOption, ViewPort} from '../service/configuration.service';
import {ConnectionService} from '../service/connection.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass']
})
export class TimelineComponent implements OnInit {

  public isCollapsed = false;

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService
  ) { }

  ngOnInit(): void {
  }

  toggleTimeline(): void {
    this.isCollapsed = !this.isCollapsed;
  }

}