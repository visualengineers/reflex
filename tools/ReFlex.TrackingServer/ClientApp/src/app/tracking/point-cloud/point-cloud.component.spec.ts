/* eslint-disable max-lines -- Keep all test scenarios for this component in one spec file. */
import { Interaction, Point3 } from '@reflex/shared-types';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import {
  mount,
  pointCloud,
  setupTests as setupZonelessTests,
  text,
  tracking
} from '../../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../../test-utils/zoneless-change-detection.test-data';
import { PointCloudComponent } from './point-cloud.component';
import {
  component as testComponent,
  fixture as testFixture,
  httpTestingController,
  setupTests
} from './point-cloud.component.test-context';
import {
  dummyPoints,
  logService,
  pointCloudService,
  processingService,
  settingsService,
  trackingService
} from './point-cloud.component.test-data';

describe('Zoneless change detection: renders point-cloud stream counters without depending on the WebGL loop', () => {
  setupZonelessTests();

  it('renders point-cloud stream counters without depending on the WebGL loop', async () => {
    // This is a DOM scheduling test, not a GPU test. Exercise the component's
    // supported no-WebGL fallback so shader compilation cannot drive the test.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    tracking.getStatus.mockReturnValue(of(streaming));
    const response = new Subject<Array<Point3>>();
    pointCloud.getPointCloud.mockReturnValue(response);
    const fixture = await mount(PointCloudComponent);
    fixture.componentRef.setInput('livePreviewEnabled', true);
    await fixture.whenStable();

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#pointCloud-livePreview-toggle')
      .click();
    await fixture.whenStable();
    response.next([{ x: 1, y: 2, z: 3, isFiltered: false, isValid: true }]);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Frames: 1');
  });
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly initialize settings', () => {
    testFixture.detectChanges();

    if (window !== undefined) {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

      httpTestingController
        .expectOne('assets/shader/pointcloud_vertex.txt')
        .flush('');
      httpTestingController
        .expectOne('assets/shader/pointcloud_fragment.txt')
        .flush('');
    }
    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should create a point cloud with the given points', () => {
    pointCloudService.getPointCloud.mockReturnValue(of(dummyPoints));

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    testFixture.detectChanges();

    expect(testComponent.numFramesReceived).toBe(1);

    expect(testComponent['isPointCloudInitialized']).toBe(true);

    expect(testComponent['points'].geometry?.attributes?.position).toBeDefined();
    expect(
      testComponent['points'].geometry?.attributes?.position?.array
    ).toHaveLength(dummyPoints.length * 3);

    for (let i = 0; i < dummyPoints.length; i++) {
      const n = i * 3;

      const pt = dummyPoints[i];

      expect(
        testComponent['points'].geometry?.attributes?.position?.array[n]
      ).toBeCloseTo(pt.x * 10, 4);
      expect(
        testComponent['points'].geometry?.attributes?.position?.array[n + 1]
      ).toBeCloseTo(pt.y * -10, 4);
      expect(
        testComponent['points'].geometry?.attributes?.position?.array[n + 2]
      ).toBeCloseTo(pt.z * 10, 4);

      if (pt.isFiltered) {
        expect(testComponent['points'].geometry?.attributes?.color?.array[n]).toBe(
          1
        );
        expect(
          testComponent['points'].geometry?.attributes?.color?.array[n + 1]
        ).toBe(0);
        expect(
          testComponent['points'].geometry?.attributes?.color?.array[n + 2]
        ).toBe(0);
      }

      // TODO: test if color are set appropriately (need to specify distances accordingly...)

      expect(logService.sendErrorLog).not.toHaveBeenCalled();
    }
  });
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should update point cloud service emits new values', () => {
    pointCloudService.getPointCloud.mockReturnValue(
      of(
        [{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }],
        [
          { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
          { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
        ],
        [{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]
      )
    );

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    testFixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(testComponent.numFramesReceived).toBe(3);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);
  });
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should not update point cloud when preview is toggled off', () => {
    const obs = new BehaviorSubject(new Array<Point3>());

    pointCloudService.getPointCloud.mockReturnValue(obs);

    testFixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);

    expect(testComponent.numFramesReceived).toBe(0);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array
    ).not.toBeDefined();

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);

    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    // ? should this not be 2 ?
    expect(testComponent.numFramesReceived).toBe(3);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);

    testComponent.livePreview = false;
    testComponent.livePreviewChanged();

    obs.next(dummyPoints);

    // frames are counted, even if not subscribed !
    expect(testComponent.numFramesReceived).toBe(3);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    obs.next([
      { x: 14, y: 15, z: 16, isValid: true, isFiltered: false },
      { x: 17, y: 18, z: 19, isValid: true, isFiltered: false }
    ]);

    expect(testComponent.numFramesReceived).toBe(5);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array
    ).toHaveLength(6);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(140, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-150, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(160, 4);

    expect(
      testComponent['points'].geometry?.attributes?.position?.array[3]
    ).toBeCloseTo(170, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[4]
    ).toBeCloseTo(-180, 4);
    expect(
      testComponent['points'].geometry?.attributes?.position?.array[5]
    ).toBeCloseTo(190, 4);

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should create interactions when service emits new values', () => {
    processingService.getInteractions.mockReturnValue(
      of([
        {
          touchId: 0,
          position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
          type: 0,
          extremumDescription: {
            type: 0,
            numFittingPoints: 10,
            percentageFittingPoints: 1
          },
          confidence: 10,
          time: 123456
        },
        {
          touchId: 1,
          position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
          type: 0,
          extremumDescription: {
            type: 0,
            numFittingPoints: 10,
            percentageFittingPoints: 1
          },
          confidence: 0,
          time: 656565989
        }
      ])
    );

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    testFixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(testComponent.numFramesReceived).toBe(0);

    expect(testComponent['interactions']).toBeDefined();
    expect(testComponent['interactions']).toHaveLength(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should update interactions when service emits new values', () => {
    const obs = new BehaviorSubject(new Array<Interaction>());

    processingService.getInteractions.mockReturnValue(obs);

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    testFixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1
        },
        confidence: 10,
        time: 123456
      },
      {
        touchId: 1,
        position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1
        },
        confidence: 0,
        time: 656565989
      }
    ]);

    expect(testComponent.numFramesReceived).toBe(0);

    expect(testComponent['interactions']).toBeDefined();
    expect(testComponent['interactions']).toHaveLength(2);

    obs.next([]);

    expect(testComponent['interactions']).toBeDefined();
    expect(testComponent['interactions']).toHaveLength(0);

    obs.next([
      {
        touchId: 0,
        position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
        type: 0,
        extremumDescription: {
          type: 0,
          numFittingPoints: 10,
          percentageFittingPoints: 1
        },
        confidence: 10,
        time: 123456
      }
    ]);

    expect(testComponent['interactions']).toBeDefined();
    expect(testComponent['interactions']).toHaveLength(1);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

function verifyStage1(obs: BehaviorSubject<Array<Interaction>>): void {
  processingService.getInteractions.mockReturnValue(obs);
  testComponent.livePreview = true;
  testComponent.livePreviewChanged();
  testFixture.detectChanges();
  expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
  obs.next([
    {
      touchId: 0,
      position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 10,
      time: 123456
    },
    {
      touchId: 1,
      position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 0,
      time: 656565989
    }
  ]);
  expect(testComponent.numFramesReceived).toBe(0);
  expect(testComponent['interactions']).toBeDefined();
  expect(testComponent['interactions']).toHaveLength(2);
  testComponent.livePreview = false;
}

function verifyStage2(obs: BehaviorSubject<Array<Interaction>>): void {
  testComponent.livePreviewChanged();
  expect(testComponent['interactions']).toBeDefined();
  expect(testComponent['interactions']).toHaveLength(0);
  obs.next([
    {
      touchId: 0,
      position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 10,
      time: 123456
    }
  ]);
  expect(testComponent['interactions']).toBeDefined();
  expect(testComponent['interactions']).toHaveLength(0);
  testComponent.livePreview = true;
  testComponent.livePreviewChanged();
}

function verifyStage3(obs: BehaviorSubject<Array<Interaction>>): void {
  obs.next([
    {
      touchId: 0,
      position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 10,
      time: 123456
    },
    {
      touchId: 1,
      position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 0,
      time: 656565989
    },
    {
      touchId: 2,
      position: { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
      type: 1,
      extremumDescription: {
        type: 1,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 15,
      time: 3542523542
    }
  ]);
  expect(testComponent['interactions']).toBeDefined();
  expect(testComponent['interactions']).toHaveLength(3);
  expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
}

function verifyScenario4(): void {
  const obs = new BehaviorSubject(new Array<Interaction>());

  verifyStage1(obs);

  verifyStage2(obs);

  verifyStage3(obs);

  expect(logService.sendErrorLog).not.toHaveBeenCalled();
}


describe('PointCloudComponent', () => {
  setupTests();

  it('should not update interactions when live preview is toggled off', verifyScenario4);
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should update livePreviewEnabled correctly', () => {
    const obs = new BehaviorSubject(new Array<Point3>());

    pointCloudService.getPointCloud.mockReturnValue(obs);

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    testFixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);
    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);
    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(testComponent.numFramesReceived).toBe(3);

    testComponent.livePreviewEnabled = false;

    expect(testComponent.numFramesReceived).toBe(0);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);
    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);

    expect(testComponent.numFramesReceived).toBe(0);

    testComponent.livePreviewEnabled = true;

    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);
    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(testComponent.numFramesReceived).toBe(0);

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);

    // strange: does start with 2 (?)
    expect(testComponent.numFramesReceived).toBe(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should emit fullScreenChanged when fullscreen is toggled', () => {
    vi.spyOn(testComponent.fullScreenChanged, 'emit');

    expect(vi.spyOn(testComponent.fullScreenChanged, 'emit')).not.toHaveBeenCalled();

    expect(testComponent.fullScreen).toBe(false);

    testComponent.fullScreen = false;

    expect(vi.spyOn(testComponent.fullScreenChanged, 'emit')).toHaveBeenCalledTimes(1);

    expect(vi.spyOn(testComponent.fullScreenChanged, 'emit')).toHaveBeenCalledWith(false);

    testComponent.fullScreen = true;

    expect(vi.spyOn(testComponent.fullScreenChanged, 'emit')).toHaveBeenCalledWith(true);
    expect(vi.spyOn(testComponent.fullScreenChanged, 'emit')).toHaveBeenCalledTimes(2);

    testComponent.fullScreen = true;

    expect(vi.spyOn(testComponent.fullScreenChanged, 'emit')).toHaveBeenCalledTimes(3);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('PointCloudComponent', () => {
  setupTests();

  it('should catch errors and log them correctly: status and settings', () => {
    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    const errorStatus = 'TestError: trackingService.getStatus';
    trackingService.getStatus.mockReturnValue(throwError(errorStatus));

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
  });

  it('should catch errors and log them correctly: pointCloud and interactions', () => {
    const errorPointCloud = 'TestError: pointCloudService.getPointCloud';
    pointCloudService.getPointCloud.mockReturnValue(
      throwError(errorPointCloud)
    );

    const errorInteractions = 'TestError: processingService.getInteractions';
    processingService.getInteractions.mockReturnValue(
      throwError(errorInteractions)
    );

    testComponent.livePreview = true;
    testComponent.livePreviewChanged();
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPointCloud);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
  });

  it('should update grid visibility', () => {
    testFixture.detectChanges();

    expect(testComponent.showGrid).toBe(true);
    expect(testComponent['grid'].visible).toBe(true);

    testComponent.showGrid = false;
    testComponent.updateGridVisibility();

    expect(testComponent['grid'].visible).toBe(false);
  });

  it('should update planes visibility', () => {
    testFixture.detectChanges();

    expect(testComponent.showDistancePlanes).toBe(true);
    expect(testComponent['zeroPlane'].visible).toBe(true);
    expect(testComponent['maxPlane1'].visible).toBe(true);
    expect(testComponent['maxPlane2'].visible).toBe(true);
    expect(testComponent['minPlane1'].visible).toBe(true);
    expect(testComponent['minPlane2'].visible).toBe(true);

    testComponent.showDistancePlanes = false;
    testComponent.updatePlanesVisibility();

    expect(testComponent['zeroPlane'].visible).toBe(false);
    expect(testComponent['maxPlane1'].visible).toBe(false);
    expect(testComponent['maxPlane2'].visible).toBe(false);
    expect(testComponent['minPlane1'].visible).toBe(false);
    expect(testComponent['minPlane2'].visible).toBe(false);
  });
});
