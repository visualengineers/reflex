import { Component, OnDestroy, OnInit } from '@angular/core';
import { TuioPackageDetails } from '@reflex/shared-types';
import { Subscription } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { TuioService } from 'src/shared/services/tuio.service';

@Component({
  selector: 'app-package-details',
  templateUrl: './package-details.component.html',
  styleUrls: ['./package-details.component.scss']
})
export class PackageDetailsComponent implements OnInit, OnDestroy {

  public details: TuioPackageDetails = {
    sessionId: 0,
    frameId: 0,
    packageContent: ''
  };

  private _packageSubscription?: Subscription;

  public constructor(private readonly tuioService: TuioService, private readonly logService: LogService) { }

  public ngOnInit(): void {
    this._packageSubscription = this.tuioService.getPackages().subscribe((result) => {
      this.details = result;
    }, (error) => {
      const errorText = `${error} - ${JSON.stringify(error, null, 3)}`;
      this.logService.sendErrorLog(errorText);
    });
  }

  public ngOnDestroy(): void {
    this._packageSubscription?.unsubscribe();
  }


}
