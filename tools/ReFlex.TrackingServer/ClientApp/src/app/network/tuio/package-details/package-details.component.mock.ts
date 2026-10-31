import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PackageDetailsComponent } from './package-details.component';
import { TuioPackageDetails } from '@reflex/shared-types';

@Component({
  selector: 'app-package-details',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockPackageDetailsComponent
  implements Partial<PackageDetailsComponent>
{
  public details: TuioPackageDetails = {
    sessionId: 0,
    frameId: 0,
    packageContent: '',
  };

  public constructor() {}
}
