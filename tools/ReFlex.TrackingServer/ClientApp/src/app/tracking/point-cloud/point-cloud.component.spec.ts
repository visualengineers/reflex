import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { PointCloudService } from 'src/shared/services/point-cloud.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { PointCloudComponent } from './point-cloud.component';
import { DEFAULT_SETTINGS, DepthCameraState, Interaction, Point3, TrackingConfigState } from '@reflex/shared-types';
import { PanelHeaderComponent, ValueSliderComponent, OptionCheckboxComponent, SettingsGroupComponent } from '@reflex/angular-components/dist';

const trackingService = jasmine.createSpyObj<TrackingService>('fakeTrackingService',
  [
    'getStatus'
  ]
);

const pointCloudService = jasmine.createSpyObj<PointCloudService>('fakePointCloudService',
  [
    'getPointCloud'
  ]
);

const processingService = jasmine.createSpyObj<ProcessingService>('fakeProcessingCloudService',
  [
    'getInteractions'
  ]
);

const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService',
  [
    'getSettings'
  ]
);

const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]
);

let httpClient: HttpClient;
let httpTestingController: HttpTestingController;

const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming]
};

const dummyPoints = new Array<Point3>();

for (let i = 0; i < 100; i++) {
  let pt = {
    x: i,
    y: -i,
    z: i + (1/i),
    isFiltered: i < 10 || i > 90,
    isValid: i % 2 == 0
  };

  dummyPoints.push(pt);
};

describe('PointCloudComponent', () => {
  let component: PointCloudComponent;
  let fixture: ComponentFixture<PointCloudComponent>;

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
    imports: [FormsModule,
        PanelHeaderComponent,
        ValueSliderComponent,
        OptionCheckboxComponent,
        SettingsGroupComponent, PointCloudComponent],
    providers: [
        {
            provide: TrackingService, useValue: trackingService
        },
        {
            provide: PointCloudService, useValue: pointCloudService
        },
        {
            provide: ProcessingService, useValue: processingService
        },
        {
            provide: SettingsService, useValue: settingsService
        },
        {
            provide: LogService, useValue: logService
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
    .compileComponents();
    })
  );

  beforeEach(() => {

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PointCloudComponent);
    component = fixture.componentInstance;

    // reset services
    pointCloudService.getPointCloud.and.returnValue(of([]));
    processingService.getInteractions.and.returnValue(of([]));

    trackingService.getStatus.and.returnValue(of(state));
    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.and.returnValue();
  });

  afterEach(() => {
    pointCloudService.getPointCloud.calls.reset();
    processingService.getInteractions.calls.reset();
    trackingService.getStatus.calls.reset();
    settingsService.getSettings.calls.reset();
    logService.sendErrorLog.calls.reset();
  });

  it('should create', async () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly initialize settings', async () => {
    fixture.detectChanges();

    if (window !== undefined) {

      spyOn(window, 'requestAnimationFrame').and.callFake((cb) => 1);

      httpTestingController.expectOne('assets/shader/pointcloud_vertex.txt').flush('');
      httpTestingController.expectOne('assets/shader/pointcloud_fragment.txt').flush('');
    }
    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should create a point cloud with the given points', async () => {

    pointCloudService.getPointCloud.and.returnValue(of(
      dummyPoints
    ));

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(component.numFramesReceived).toBe(1);

    expect(component['isPointCloudInitialized']).toBeTrue();

    expect(component['points'].geometry?.attributes?.position).toBeDefined();
    expect(component['points'].geometry?.attributes?.position?.array).toHaveSize(dummyPoints.length * 3);

    for (var i = 0; i < dummyPoints.length; i++) {
      let n = i*3;

      let pt = dummyPoints[i];

      expect(component['points'].geometry?.attributes?.position?.array[n]).toBeCloseTo(pt.x * 10, 4);
      expect(component['points'].geometry?.attributes?.position?.array[n+1]).toBeCloseTo(pt.y * -10, 4);
      expect(component['points'].geometry?.attributes?.position?.array[n+2]).toBeCloseTo(pt.z * 10, 4);


      if (pt.isFiltered) {
        expect(component['points'].geometry?.attributes?.color?.array[n]).toBe(1);
        expect(component['points'].geometry?.attributes?.color?.array[n+1]).toBe(0);
        expect(component['points'].geometry?.attributes?.color?.array[n+2]).toBe(0);
      }

      // TODO: test if color are set appropriately (need to specify distances accordingly...)

      expect(logService.sendErrorLog).not.toHaveBeenCalled();
    }

  });

  it('should update point cloud service emits new values', async() => {
    pointCloudService.getPointCloud.and.returnValue(of(
      [{x: 1, y: 2, z: 3, isValid: true, isFiltered: false}],
      [{x: 4, y: 5, z: 6, isValid: true, isFiltered: false}, {x: 7, y: 8, z: 9, isValid: true, isFiltered: false}],
      [{x: 10, y: 11, z: 12, isValid: true, isFiltered: false }],
    ));

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(component.numFramesReceived).toBe(3);

    expect(component['points'].geometry?.attributes?.position?.array[0]).toBeCloseTo(100, 4);
    expect(component['points'].geometry?.attributes?.position?.array[1]).toBeCloseTo(-110, 4);
    expect(component['points'].geometry?.attributes?.position?.array[2]).toBeCloseTo(120, 4);
  });

  it('should not update point cloud when preview is toggled off', async() => {

    let obs = new BehaviorSubject(new Array<Point3>);

    pointCloudService.getPointCloud.and.returnValue(obs);

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{x: 1, y: 2, z: 3, isValid: true, isFiltered: false}]);

    expect(component.numFramesReceived).toBe(0);

    expect(component['points'].geometry?.attributes?.position?.array).not.toBeDefined();

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next(
      [{x: 4, y: 5, z: 6, isValid: true, isFiltered: false}, {x: 7, y: 8, z: 9, isValid: true, isFiltered: false}],
    );

    obs.next([{x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    // ? should this not be 2 ?
    expect(component.numFramesReceived).toBe(3);

    expect(component['points'].geometry?.attributes?.position?.array[0]).toBeCloseTo(100, 4);
    expect(component['points'].geometry?.attributes?.position?.array[1]).toBeCloseTo(-110, 4);
    expect(component['points'].geometry?.attributes?.position?.array[2]).toBeCloseTo(120, 4);

    component.livePreview = false;
    component.livePreviewChanged();

    obs.next(dummyPoints);

    // frames are counted, even if not subscribed !
    expect(component.numFramesReceived).toBe(3);

    expect(component['points'].geometry?.attributes?.position?.array[0]).toBeCloseTo(100, 4);
    expect(component['points'].geometry?.attributes?.position?.array[1]).toBeCloseTo(-110, 4);
    expect(component['points'].geometry?.attributes?.position?.array[2]).toBeCloseTo(120, 4);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next(
      [{x: 14, y: 15, z: 16, isValid: true, isFiltered: false}, {x: 17, y: 18, z: 19, isValid: true, isFiltered: false}],
    );

    expect(component.numFramesReceived).toBe(5);

    expect(component['points'].geometry?.attributes?.position?.array).toHaveSize(6);

    expect(component['points'].geometry?.attributes?.position?.array[0]).toBeCloseTo(140, 4);
    expect(component['points'].geometry?.attributes?.position?.array[1]).toBeCloseTo(-150, 4);
    expect(component['points'].geometry?.attributes?.position?.array[2]).toBeCloseTo(160, 4);

    expect(component['points'].geometry?.attributes?.position?.array[3]).toBeCloseTo(170, 4);
    expect(component['points'].geometry?.attributes?.position?.array[4]).toBeCloseTo(-180, 4);
    expect(component['points'].geometry?.attributes?.position?.array[5]).toBeCloseTo(190, 4);

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

  });

  it('should create interactions when service emits new values', async() => {
    processingService.getInteractions.and.returnValue(of([
      {
        touchId: 0,
        position: {x: 1, y: 2, z: 3, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 10,
        time: 123456
       },
       {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 0,
        time: 656565989
       },
    ]
    ));

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });


  it('should update interactions when service emits new values', async() => {
    let obs = new BehaviorSubject(new Array<Interaction>);

    processingService.getInteractions.and.returnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    obs.next([
      {
        touchId: 0,
        position: {x: 1, y: 2, z: 3, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 10,
        time: 123456
       },
       {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 0,
        time: 656565989
       },
      ]
    );

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(2);

    obs.next([]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(0);

    obs.next([
      {
        touchId: 0,
        position: {x: 1, y: 2, z: 3, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 10,
        time: 123456
       },
    ]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(1);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

  });

  it('should not update interactions when live preview is toggled off', async() => {
    let obs = new BehaviorSubject(new Array<Interaction>);

    processingService.getInteractions.and.returnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    obs.next([
      {
        touchId: 0,
        position: {x: 1, y: 2, z: 3, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 10,
        time: 123456
      },
      {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 0,
        time: 656565989
      }
      ]
    );

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(2);

    component.livePreview = false;
    component.livePreviewChanged();

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(0);

    obs.next([
      {
        touchId: 0,
        position: {x: 1, y: 2, z: 3, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 10,
        time: 123456
      }
    ]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(0);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([
      {
        touchId: 0,
        position: {x: 1, y: 2, z: 3, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 10,
        time: 123456
      },
      {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false},
        type: 0,
        extremumDescription: { type: 0, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 0,
        time: 656565989
      },
      {
        touchId: 2,
        position: { x: 7, y: 8, z: 9, isValid: true, isFiltered: false},
        type: 1,
        extremumDescription: { type: 1, numFittingPoints: 10, percentageFittingPoints: 1 },
        confidence: 15,
        time: 3542523542
      }
      ]
    );

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveSize(3);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

  });

  it('should update livePreviewEnabled correctly', () => {
    let obs = new BehaviorSubject(new Array<Point3>);

    pointCloudService.getPointCloud.and.returnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{x: 1, y: 2, z: 3, isValid: true, isFiltered: false}]);
    obs.next([{x: 4, y: 5, z: 6, isValid: true, isFiltered: false}, {x: 7, y: 8, z: 9, isValid: true, isFiltered: false}]);
    obs.next([{x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(3);

    component.livePreviewEnabled = false;

    expect(component.numFramesReceived).toBe(0);

    obs.next([{x: 1, y: 2, z: 3, isValid: true, isFiltered: false}]);
    obs.next([{x: 4, y: 5, z: 6, isValid: true, isFiltered: false}, {x: 7, y: 8, z: 9, isValid: true, isFiltered: false}]);

    expect(component.numFramesReceived).toBe(0);

    component.livePreviewEnabled = true;

    obs.next([{x: 4, y: 5, z: 6, isValid: true, isFiltered: false}, {x: 7, y: 8, z: 9, isValid: true, isFiltered: false}]);
    obs.next([{x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(0);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([{x: 1, y: 2, z: 3, isValid: true, isFiltered: false}]);

    // strange: does start with 2 (?)
    expect(component.numFramesReceived).toBe(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should emit fullScreenChanged when fullscreen is toggled', () => {
    spyOn(component.fullScreenChanged, 'emit').and.callThrough();

    expect(component.fullScreenChanged.emit).not.toHaveBeenCalled();

    expect(component.fullScreen).toBeFalse();

    component.fullScreen = false;

    expect(component.fullScreenChanged.emit).toHaveBeenCalledOnceWith(false);

    component.fullScreen = true;

    expect(component.fullScreenChanged.emit).toHaveBeenCalledWith(true);
    expect(component.fullScreenChanged.emit).toHaveBeenCalledTimes(2);

    component.fullScreen = true;

    expect(component.fullScreenChanged.emit).toHaveBeenCalledTimes(3);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should catch errors and log them correctly: status and settings', async () => {

    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.and.returnValue(throwError(errorSettings));

    const errorStatus = 'TestError: trackingService.getStatus';
    trackingService.getStatus.and.returnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
  });

  it('should catch errors and log them correctly: pointCloud and interactions', async () => {

    const errorPointCloud = 'TestError: pointCloudService.getPointCloud';
    pointCloudService.getPointCloud.and.returnValue(throwError(errorPointCloud));

    const errorInteractions = 'TestError: processingService.getInteractions';
    processingService.getInteractions.and.returnValue(throwError(errorInteractions));

    component.livePreview = true;
    component.livePreviewChanged();
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPointCloud);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
  });

  it('should update grid visibility', () => {
    fixture.detectChanges();

    expect(component.showGrid).toBeTrue();
    expect(component['grid'].visible).toBeTrue();

    component.showGrid = false;
    component.updateGridVisibility();

    expect(component['grid'].visible).toBeFalse();
  });

  it('should update planes visibility', () => {
    fixture.detectChanges();

    expect(component.showDistancePlanes).toBeTrue();
    expect(component['zeroPlane'].visible).toBeTrue();
    expect(component['maxPlane1'].visible).toBeTrue();
    expect(component['maxPlane2'].visible).toBeTrue();
    expect(component['minPlane1'].visible).toBeTrue();
    expect(component['minPlane2'].visible).toBeTrue();

    component.showDistancePlanes = false;
    component.updatePlanesVisibility();

    expect(component['zeroPlane'].visible).toBeFalse();
    expect(component['maxPlane1'].visible).toBeFalse();
    expect(component['maxPlane2'].visible).toBeFalse();
    expect(component['minPlane1'].visible).toBeFalse();
    expect(component['minPlane2'].visible).toBeFalse();
  });
});
