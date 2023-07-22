import { Component, OnInit } from '@angular/core';
import { DataFormats } from '@reflex/shared-types';
import { Observable } from 'rxjs';
import { VersionInfoService } from 'src/shared/services/version.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit {
  public serverLibs?: Observable<Array<DataFormats.AppVersionInfo>>;
  public clientLibs?: Observable<Array<DataFormats.AppVersionInfo>>;

  public appVersion?: Observable<DataFormats.AppVersionInfo>;

  public constructor(private readonly versionService: VersionInfoService) { }


  public ngOnInit(): void {
    this.serverLibs = this.versionService.getServerVersionInfo();
    this.clientLibs = this.versionService.getClientVersionInfo();
    this.appVersion = this.versionService.getAppVersionInfo();
  }
}
