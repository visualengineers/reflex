import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { PointCloudService } from 'src/shared/services/point-cloud.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { PointCloudComponent } from './point-cloud.component';
import {
  DEFAULT_SETTINGS,
  DepthCameraState,
  Interaction,
  Point3,
  TrackingConfigState,
} from '@reflex/shared-types';
import {
  PanelHeaderComponent,
  ValueSliderComponent,
  OptionCheckboxComponent,
  SettingsGroupComponent,
  MockPanelHeaderComponent,
  MockOptionCheckboxComponent,
  MockSettingsGroupComponent,
  MockValueSliderComponent,
} from '@reflex/angular-components/dist';

const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus'),
};

const pointCloudService = {
  getPointCloud: vi.fn().mockName('fakePointCloudService.getPointCloud'),
};

const processingService = {
  getInteractions: vi
    .fn()
    .mockName('fakeProcessingCloudService.getInteractions'),
};

const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
};

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
};

let httpClient: HttpClient;
let httpTestingController: HttpTestingController;

const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming],
};

const dummyPoints = new Array<Point3>();

for (let i = 0; i < 100; i++) {
  let pt = {
    x: i,
    y: -i,
    z: i + 1 / i,
    isFiltered: i < 10 || i > 90,
    isValid: i % 2 == 0,
  };

  dummyPoints.push(pt);
}

describe('PointCloudComponent', () => {
  let component: PointCloudComponent;
  let fixture: ComponentFixture<PointCloudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, PointCloudComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService,
        },
        {
          provide: PointCloudService,
          useValue: pointCloudService,
        },
        {
          provide: ProcessingService,
          useValue: processingService,
        },
        {
          provide: SettingsService,
          useValue: settingsService,
        },
        {
          provide: LogService,
          useValue: logService,
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(PointCloudComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSliderComponent,
            OptionCheckboxComponent,
            SettingsGroupComponent,
          ],
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSliderComponent,
            MockOptionCheckboxComponent,
            MockSettingsGroupComponent,
          ],
        },
      })

      .compileComponents();
  });

  beforeEach(() => {
    // These tests exercise geometry and service state, not native GPU rendering.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PointCloudComponent);
    component = fixture.componentInstance;

    // reset services
    pointCloudService.getPointCloud.mockReturnValue(of([]));
    processingService.getInteractions.mockReturnValue(of([]));

    trackingService.getStatus.mockReturnValue(of(state));
    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.mockReturnValue(undefined);
  });

  afterEach(() => {
    pointCloudService.getPointCloud.mockClear();
    processingService.getInteractions.mockClear();
    trackingService.getStatus.mockClear();
    settingsService.getSettings.mockClear();
    logService.sendErrorLog.mockClear();
  });

  it('should create', async () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly initialize settings', async () => {
    fixture.detectChanges();

    if (window !== undefined) {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => 1);

      httpTestingController
        .expectOne('assets/shader/pointcloud_vertex.txt')
        .flush('');
      httpTestingController
        .expectOne('assets/shader/pointcloud_fragment.txt')
        .flush('');
    }
    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should create a point cloud with the given points', async () => {
    pointCloudService.getPointCloud.mockReturnValue(of(dummyPoints));

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(component.numFramesReceived).toBe(1);

    expect(component['isPointCloudInitialized']).toBe(true);

    expect(component['points'].geometry?.attributes?.position).toBeDefined();
    expect(
      component['points'].geometry?.attributes?.position?.array
    ).toHaveLength(dummyPoints.length * 3);

    for (var i = 0; i < dummyPoints.length; i++) {
      let n = i * 3;

      let pt = dummyPoints[i];

      expect(
        component['points'].geometry?.attributes?.position?.array[n]
      ).toBeCloseTo(pt.x * 10, 4);
      expect(
        component['points'].geometry?.attributes?.position?.array[n + 1]
      ).toBeCloseTo(pt.y * -10, 4);
      expect(
        component['points'].geometry?.attributes?.position?.array[n + 2]
      ).toBeCloseTo(pt.z * 10, 4);

      if (pt.isFiltered) {
        expect(component['points'].geometry?.attributes?.color?.array[n]).toBe(
          1
        );
        expect(
          component['points'].geometry?.attributes?.color?.array[n + 1]
        ).toBe(0);
        expect(
          component['points'].geometry?.attributes?.color?.array[n + 2]
        ).toBe(0);
      }

      // TODO: test if color are set appropriately (need to specify distances accordingly...)

      expect(logService.sendErrorLog).not.toHaveBeenCalled();
    }
  });

  it('should update point cloud service emits new values', async () => {
    pointCloudService.getPointCloud.mockReturnValue(
      of(
        [{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }],
        [
          { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
          { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
        ],
        [{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]
      )
    );

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(component.numFramesReceived).toBe(3);

    expect(
      component['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);
  });

  it('should not update point cloud when preview is toggled off', async () => {
    let obs = new BehaviorSubject(new Array<Point3>());

    pointCloudService.getPointCloud.mockReturnValue(obs);

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(0);

    expect(
      component['points'].geometry?.attributes?.position?.array
    ).not.toBeDefined();

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
    ]);

    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    // ? should this not be 2 ?
    expect(component.numFramesReceived).toBe(3);

    expect(
      component['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);

    component.livePreview = false;
    component.livePreviewChanged();

    obs.next(dummyPoints);

    // frames are counted, even if not subscribed !
    expect(component.numFramesReceived).toBe(3);

    expect(
      component['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([
      { x: 14, y: 15, z: 16, isValid: true, isFiltered: false },
      { x: 17, y: 18, z: 19, isValid: true, isFiltered: false },
    ]);

    expect(component.numFramesReceived).toBe(5);

    expect(
      component['points'].geometry?.attributes?.position?.array
    ).toHaveLength(6);

    expect(
      component['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(140, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-150, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(160, 4);

    expect(
      component['points'].geometry?.attributes?.position?.array[3]
    ).toBeCloseTo(170, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[4]
    ).toBeCloseTo(-180, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[5]
    ).toBeCloseTo(190, 4);

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should create interactions when service emits new values', async () => {
    processingService.getInteractions.mockReturnValue(
      of([
        {
          touchId: 0,
          position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
          type: 0,
          extremumDescription: {
            type: 0,
            numFittingPoints: 10,
            percentageFittingPoints: 1,
          },
          confidence: 10,
          time: 123456,
        },
        {
          touchId: 1,
          position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
          type: 0,
          extremumDescription: {
            type: 0,
            numFittingPoints: 10,
            percentageFittingPoints: 1,
          },
          confidence: 0,
          time: 656565989,
        },
      ])
    );

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should update interactions when service emits new values', async () => {
    let obs = new BehaviorSubject(new Array<Interaction>());

    processingService.getInteractions.mockReturnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 10,
        time: 123456,
      },
      {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 0,
        time: 656565989,
      },
    ]);

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(2);

    obs.next([]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(0);

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 10,
        time: 123456,
      },
    ]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(1);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should not update interactions when live preview is toggled off', async () => {
    let obs = new BehaviorSubject(new Array<Interaction>());

    processingService.getInteractions.mockReturnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 10,
        time: 123456,
      },
      {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 0,
        time: 656565989,
      },
    ]);

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(2);

    component.livePreview = false;
    component.livePreviewChanged();

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(0);

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 10,
        time: 123456,
      },
    ]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(0);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 10,
        time: 123456,
      },
      {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 0,
        time: 656565989,
      },
      {
        touchId: 2,
        position: { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
        type: 1,
        extremumDescription: {
          type: 1,
          numFittingPoints: 10,
          percentageFittingPoints: 1,
        },
        confidence: 15,
        time: 3542523542,
      },
    ]);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(3);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should update livePreviewEnabled correctly', () => {
    let obs = new BehaviorSubject(new Array<Point3>());

    pointCloudService.getPointCloud.mockReturnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);
    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
    ]);
    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(3);

    component.livePreviewEnabled = false;

    expect(component.numFramesReceived).toBe(0);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);
    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
    ]);

    expect(component.numFramesReceived).toBe(0);

    component.livePreviewEnabled = true;

    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
    ]);
    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(0);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);

    // strange: does start with 2 (?)
    expect(component.numFramesReceived).toBe(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should emit fullScreenChanged when fullscreen is toggled', () => {
    vi.spyOn(component.fullScreenChanged, 'emit');

    expect(component.fullScreenChanged.emit).not.toHaveBeenCalled();

    expect(component.fullScreen).toBe(false);

    component.fullScreen = false;

    expect(component.fullScreenChanged.emit).toHaveBeenCalledTimes(1);

    expect(component.fullScreenChanged.emit).toHaveBeenCalledWith(false);

    component.fullScreen = true;

    expect(component.fullScreenChanged.emit).toHaveBeenCalledWith(true);
    expect(component.fullScreenChanged.emit).toHaveBeenCalledTimes(2);

    component.fullScreen = true;

    expect(component.fullScreenChanged.emit).toHaveBeenCalledTimes(3);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should catch errors and log them correctly: status and settings', async () => {
    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    const errorStatus = 'TestError: trackingService.getStatus';
    trackingService.getStatus.mockReturnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
  });

  it('should catch errors and log them correctly: pointCloud and interactions', async () => {
    const errorPointCloud = 'TestError: pointCloudService.getPointCloud';
    pointCloudService.getPointCloud.mockReturnValue(
      throwError(errorPointCloud)
    );

    const errorInteractions = 'TestError: processingService.getInteractions';
    processingService.getInteractions.mockReturnValue(
      throwError(errorInteractions)
    );

    component.livePreview = true;
    component.livePreviewChanged();
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPointCloud);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
  });

  it('should update grid visibility', () => {
    fixture.detectChanges();

    expect(component.showGrid).toBe(true);
    expect(component['grid'].visible).toBe(true);

    component.showGrid = false;
    component.updateGridVisibility();

    expect(component['grid'].visible).toBe(false);
  });

  it('should update planes visibility', () => {
    fixture.detectChanges();

    expect(component.showDistancePlanes).toBe(true);
    expect(component['zeroPlane'].visible).toBe(true);
    expect(component['maxPlane1'].visible).toBe(true);
    expect(component['maxPlane2'].visible).toBe(true);
    expect(component['minPlane1'].visible).toBe(true);
    expect(component['minPlane2'].visible).toBe(true);

    component.showDistancePlanes = false;
    component.updatePlanesVisibility();

    expect(component['zeroPlane'].visible).toBe(false);
    expect(component['maxPlane1'].visible).toBe(false);
    expect(component['maxPlane2'].visible).toBe(false);
    expect(component['minPlane1'].visible).toBe(false);
    expect(component['minPlane2'].visible).toBe(false);
  });
});
