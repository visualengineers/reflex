import { Component } from '@angular/core';
import { ConfigurationService } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [],
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss'
})
export class OptionsComponent implements OnInit, OnDestroy {

  constructor(
    private configurationService: ConfigurationService,
    private connectionService: ConnectionService
  ) {}

  ngOnInit(): void {
      this.connectionService.init();
  }

  ngOnDestroy(): void {
      this.connectionService.disconnect();
  }
}
