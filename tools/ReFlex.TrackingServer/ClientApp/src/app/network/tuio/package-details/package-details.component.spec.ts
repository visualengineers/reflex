import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageDetailsComponent } from './package-details.component';
import { LogService } from 'src/app/log/log.service';
import { TuioService } from 'src/shared/services/tuio.service';
import { of, throwError } from 'rxjs';
import { TuioPackageDetails } from '@reflex/shared-types';


const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]);


const tuioService = jasmine.createSpyObj<TuioService>('fakeTuioService',
  [
    'getPackages'
  ]);

const details: TuioPackageDetails = {
  sessionId: 5,
  frameId: 12,
  packageContent: 'TestContent'
};

describe('PackageDetailsComponent', () => {
  let component: PackageDetailsComponent;
  let fixture: ComponentFixture<PackageDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageDetailsComponent ],
      providers: [
        {
          provide: TuioService, useValue: tuioService
        },
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageDetailsComponent);
    component = fixture.componentInstance;

    logService.sendErrorLog.and.returnValue();
    tuioService.getPackages.and.returnValue(of(details));
  });

  afterEach(() => {
    logService.sendErrorLog.calls.reset(); 

    tuioService.getPackages.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();
    
    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(tuioService.getPackages).toHaveBeenCalledTimes(1);
    expect(component.details).toEqual(details);
  });

  it('should handle errors correctly', () => {
    const errorPackages = 'TestError: tuioService.getPackages';
    tuioService.getPackages.and.returnValue(throwError(errorPackages));
    
    fixture.detectChanges();
    
    expect(component).toBeTruthy();

    const formattedMsg = `${errorPackages} - ${JSON.stringify(errorPackages, null, 3)}`
    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(formattedMsg);
    expect(tuioService.getPackages).toHaveBeenCalledTimes(1);    
  });


});
