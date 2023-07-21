import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AppVersionInfo } from 'src/shared/data-formats/app-version-info';
import { VersionInfoService } from 'src/shared/services/version.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit {
  public serverLibs?: Observable<Array<AppVersionInfo>>;
  public clientLibs?: Observable<Array<AppVersionInfo>>;

  public appVersion?: Observable<AppVersionInfo>;

  public constructor(private readonly versionService: VersionInfoService) { }


  public ngOnInit(): void {
    this.serverLibs = this.versionService.getServerVersionInfo();
    this.clientLibs = this.versionService.getClientVersionInfo();
    this.appVersion = this.versionService.getAppVersionInfo();
  }
}
