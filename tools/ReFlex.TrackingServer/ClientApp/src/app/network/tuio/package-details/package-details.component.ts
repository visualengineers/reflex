import { markViewForCheck } from 'src/shared/util/mark-view-for-check';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly tuioService = inject(TuioService);
  private readonly logService = inject(LogService);

  public details: TuioPackageDetails = {
    sessionId: 0,
    frameId: 0,
    packageContent: ''
  };

  private packageSubscription?: Subscription;

  public ngOnInit(): void {
    this.packageSubscription = this.tuioService.getPackages().pipe(markViewForCheck(this.changeDetector)).subscribe(
      (result) => {
        this.details = result;
      },
      (error) => {
        const errorText = `${error} - ${JSON.stringify(error, null, 3)}`;
        this.logService.sendErrorLog(errorText);
      }
    );
  }

  public ngOnDestroy(): void {
    this.packageSubscription?.unsubscribe();
  }
}
