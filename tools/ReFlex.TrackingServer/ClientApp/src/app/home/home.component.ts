import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AppVersionInfo } from '@reflex/shared-types';
import { Observable } from 'rxjs';
import { VersionInfoService } from 'src/shared/services/version.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [CommonModule]
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
