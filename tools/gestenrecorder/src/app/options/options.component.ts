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
    private connectionService: ConnectionService,
  ) {}

  // TODO: options for configurationService (create boxes and buttons just like the sidebar in the emulator)
  ngOnInit(): void {
      this.connectionService.init();
  }

  ngOnDestroy(): void {
      this.connectionService.disconnect();
  }
}
