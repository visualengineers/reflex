import { Component } from '@angular/core';
import { PackageDetailsComponent } from './package-details.component';
import { TuioPackageDetails } from 'src/shared/data-formats/tuio-package-details';

@Component({selector: 'app-package-details',  template: ''})
export class MockPackageDetailsComponent implements Partial<PackageDetailsComponent> {

  public details: TuioPackageDetails = {
    sessionId: 0,
    frameId: 0,
    packageContent: ''
  };

  public constructor() { }
}