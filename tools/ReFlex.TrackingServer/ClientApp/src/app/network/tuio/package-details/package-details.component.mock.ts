import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuioPackageDetails } from '@reflex/shared-types';
import { PackageDetailsComponent } from './package-details.component';

@Component({
  selector: 'app-package-details',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockPackageDetailsComponent
implements Partial<PackageDetailsComponent> {
  public details: TuioPackageDetails = {
    sessionId: 0,
    frameId: 0,
    packageContent: ''
  };

}
