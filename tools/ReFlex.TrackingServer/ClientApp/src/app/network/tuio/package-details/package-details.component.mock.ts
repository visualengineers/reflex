import { Component } from '@angular/core';
import { PackageDetailsComponent } from './package-details.component';
import { TuioPackageDetails } from '@reflex/shared-types';

@Component({
    selector: 'app-package-details', template: '',
    standalone: false
})
export class MockPackageDetailsComponent implements Partial<PackageDetailsComponent> {

  public details: TuioPackageDetails = {
    sessionId: 0,
    frameId: 0,
    packageContent: ''
  };

  public constructor() { }
}