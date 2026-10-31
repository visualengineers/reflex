import { NgZone, Type } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Subject, of } from 'rxjs';
import {
  AppVersionInfo,
  CompleteInteractionData,
  DEFAULT_SETTINGS,
  DepthCamera,
  DepthCameraState,
  FrameSizeDefinition,
  Interaction,
  InteractionFrame,
  InteractionHistory,
  LogLevel,
  LogMessageDetail,
  PerformanceData,
  Point3,
  RecordingState,
  RecordingStateUpdate,
  TrackingConfigState,
  TrackingServerAppSettings,
  TuioPackageDetails,
} from '@reflex/shared-types';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { MeasureService } from 'src/shared/services/measure.service';
import { NetworkingService } from 'src/shared/services/networking.service';
import { PerformanceService } from 'src/shared/services/performance.service';
import { PointCloudService } from 'src/shared/services/point-cloud.service';
import { appConfig } from './app.config';
import { ProcessingService } from 'src/shared/services/processing.service';
import { RecordingService } from 'src/shared/services/recording.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { TuioService } from 'src/shared/services/tuio.service';
import { VersionInfoService } from 'src/shared/services/version.service';
import { WebSocketService } from 'src/shared/services/webSocket.service';
import { CalibrationComponent } from './calibration/calibration.component';
import { HomeComponent } from './home/home.component';
import { LogComponent } from './log/log.component';
import { LogService } from './log/log.service';
import { MeasureControlsComponent } from './measure-surface/measure-controls/measure-controls.component';
import { MeasureSurfaceComponent } from './measure-surface/measure-surface.component';
import { NetworkComponent } from './network/network.component';
import { PackageDetailsComponent } from './network/tuio/package-details/package-details.component';
import { TuioComponent } from './network/tuio/tuio.component';
import { HistoryComponent } from './processing/history/history.component';
import { HistoryVisualizationComponent } from './processing/history-visualization/history-visualization.component';
import { InteractionsComponent } from './processing/interactions/interactions.component';
import { InteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component';
import { ProcessingComponent } from './processing/processing.component';
import { SettingsComponent } from './settings/settings.component';
import { DepthImageComponent } from './tracking/depth-image/depth-image.component';
import { PointCloudComponent } from './tracking/point-cloud/point-cloud.component';
import { RecordingComponent } from './tracking/recording/recording.component';
import { TrackingComponent } from './tracking/tracking.component';
import { MockDepthImageComponent } from './tracking/depth-image/depth-image.component.mock';
import { MockPointCloudComponent } from './tracking/point-cloud/point-cloud.component.mock';
import { MockRecordingComponent } from './tracking/recording/recording.component.mock';
import { MockSettingsComponent } from './settings/settings.component.mock';
import { MockInteractionsComponent } from './processing/interactions/interactions.component.mock';
import { MockInteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component.mock';
import { MockHistoryComponent } from './processing/history/history.component.mock';

/** No connections or real HTTP: each test controls the component's async boundary. */
function mockService<T>(type: Type<T>): jasmine.SpyObj<T> {
  const methods = new Set<string>();
  let prototype: object | null = type.prototype;
  while (prototype && prototype !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (
        name !== 'constructor' &&
        typeof Object.getOwnPropertyDescriptor(prototype, name)?.value ===
          'function'
      )
        methods.add(name);
    }
    prototype = Object.getPrototypeOf(prototype) as object | null;
  }
  const mock = jasmine.createSpyObj(type.name, [
    ...methods,
  ]) as jasmine.SpyObj<T>;
  for (const method of methods)
    (mock[method as keyof T] as jasmine.Spy).and.returnValue(NEVER);
  TestBed.overrideProvider(type, { useValue: mock });
  return mock;
}

const streaming: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'Test camera',
  selectedConfigurationName: 'Test configuration',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming],
};
const frame: FrameSizeDefinition = {
  top: 17,
  left: 23,
  width: 640,
  height: 480,
};
const interaction: Interaction = {
  touchId: 42,
  confidence: 10,
  time: 638000000000000000,
  type: 0,
  extremumDescription: {
    type: 0,
    numFittingPoints: 10,
    percentageFittingPoints: 100,
  },
  position: { x: 0.25, y: 0.5, z: 0.1, isFiltered: false, isValid: true },
};
const interactionData = (): CompleteInteractionData => ({
  raw: [structuredClone(interaction)],
  normalized: [structuredClone(interaction)],
  absolute: [structuredClone(interaction)],
});

describe('TrackingServer zoneless DOM updates', () => {
  let settings: jasmine.SpyObj<SettingsService>;
  let tracking: jasmine.SpyObj<TrackingService>;
  let processing: jasmine.SpyObj<ProcessingService>;
  let calibration: jasmine.SpyObj<CalibrationService>;
  let network: jasmine.SpyObj<NetworkingService>;
  let tuio: jasmine.SpyObj<TuioService>;
  let performance: jasmine.SpyObj<PerformanceService>;
  let recording: jasmine.SpyObj<RecordingService>;
  let measure: jasmine.SpyObj<MeasureService>;
  let log: jasmine.SpyObj<LogService>;
  let version: jasmine.SpyObj<VersionInfoService>;
  let websocket: jasmine.SpyObj<WebSocketService>;
  let pointCloud: jasmine.SpyObj<PointCloudService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BASE_URL, useValue: 'http://localhost/' },
      ],
    });
    settings = mockService(SettingsService);
    tracking = mockService(TrackingService);
    processing = mockService(ProcessingService);
    calibration = mockService(CalibrationService);
    network = mockService(NetworkingService);
    tuio = mockService(TuioService);
    performance = mockService(PerformanceService);
    recording = mockService(RecordingService);
    measure = mockService(MeasureService);
    log = mockService(LogService);
    version = mockService(VersionInfoService);
    websocket = mockService(WebSocketService);
    pointCloud = mockService(PointCloudService);
  });

  // Deliberately no detectChanges()/markForCheck(): Angular must schedule updates.
  async function mount<T>(type: Type<T>): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    for (const request of TestBed.inject(HttpTestingController).match((req) =>
      req.url.startsWith('assets/shader/')
    ))
      request.flush('');
    await fixture.whenStable();
    return fixture;
  }
  const text = <T>(fixture: ComponentFixture<T>): string =>
    (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('initializes the production application configuration without Zone.js', async () => {
    expect(
      (globalThis as typeof globalThis & { Zone?: unknown }).Zone
    ).toBeUndefined();
    const application = await createApplication(appConfig);
    try {
      expect(
        application.injector.get(NgZone).run(() => NgZone.isInAngularZone())
      ).toBeFalse();
    } finally {
      application.destroy();
    }
  });

  it('renders HTTP version results through AsyncPipe', async () => {
    const response = new Subject<AppVersionInfo>();
    version.getAppVersionInfo.and.returnValue(response);
    const fixture = await mount(HomeComponent);
    response.next({ name: 'server', version: 'zoneless-version' });
    await fixture.whenStable();
    expect(text(fixture)).toContain('zoneless-version');
  });

  function isolateTracking(): void {
    TestBed.overrideComponent(TrackingComponent, {
      remove: {
        imports: [
          SettingsComponent,
          DepthImageComponent,
          PointCloudComponent,
          RecordingComponent,
        ],
      },
      add: {
        imports: [
          MockSettingsComponent,
          MockDepthImageComponent,
          MockPointCloudComponent,
          MockRecordingComponent,
        ],
      },
    });
  }

  it('renders a delayed camera-list HTTP response', async () => {
    isolateTracking();
    const response = new Subject<DepthCamera[]>();
    tracking.getCameras.and.returnValue(response);
    const fixture = await mount(TrackingComponent);
    response.next([
      {
        id: '42',
        modelDescription: 'Async camera',
        state: DepthCameraState.Connected,
        streamParameter: {
          name: 'config',
          width: 128,
          height: 96,
          framerate: 30,
        },
      },
    ]);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('#tracking-camera-select').textContent
    ).toContain('Async camera');
  });

  it('renders SignalR camera status without another UI event', async () => {
    isolateTracking();
    const status = new Subject<TrackingConfigState>();
    tracking.getStatus.and.returnValue(status);
    const fixture = await mount(TrackingComponent);
    status.next(streaming);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Streaming');
  });

  it('updates nested settings and form controls after a settings response', async () => {
    const response = new Subject<TrackingServerAppSettings>();
    settings.getSettings.and.returnValue(response);
    const fixture = await mount(SettingsComponent);
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.borderValue.left = 12;
    response.next(value);
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'app-value-slider[elementid="settings-leftBorder"] input.custom-input'
    );
    expect(input.value).toBe('12');
  });

  it('renders performance stream updates in the filter table', async () => {
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.measurePerformance = true;
    settings.getSettings.and.returnValue(of(value));
    const response = new Subject<PerformanceData>();
    performance.getData.and.returnValue(response);
    const fixture = await mount(SettingsComponent);
    response.next({
      data: [
        {
          frameId: 8123,
          frameStart: 1,
          frameEnd: 2,
          totalFrameTime: 1,
          boxFilter: 1,
        },
      ],
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('8123');
  });

  it('renders limitation-filter polling responses', async () => {
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.limitationFilterType = 1;
    settings.getSettings.and.returnValue(of(value));
    tracking.getStatus.and.returnValue(of(streaming));
    const response = new Subject<{ name: string; value: boolean }>();
    let pollStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      pollStarted = resolve;
    });
    settings.isLimitationFilterInitializing.and.callFake(() => {
      pollStarted();
      return response;
    });
    settings.isLimitationFilterInitialized.and.returnValue(
      of({ name: 'initialized', value: false })
    );
    const fixture = await mount(SettingsComponent);
    const button = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('a'),
    ].find((node) => node.textContent?.includes('Initialize Filter'))!;
    expect(button.classList).not.toContain('button-disabled');
    await started;
    response.next({ name: 'initializing', value: true });
    await fixture.whenStable();
    expect(button.classList).toContain('button-disabled');
  });

  it('renders processing status even when no interactions arrive', async () => {
    TestBed.overrideComponent(ProcessingComponent, {
      remove: {
        imports: [
          InteractionsComponent,
          InteractionsVisualizationComponent,
          HistoryComponent,
        ],
      },
      add: {
        imports: [
          MockInteractionsComponent,
          MockInteractionsVisualizationComponent,
          MockHistoryComponent,
        ],
      },
    });
    const response = new Subject<string>();
    processing.getStatus.and.returnValue(response);
    const fixture = await mount(ProcessingComponent);
    response.next('Active');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain(
      'Active'
    );
  });

  it('renders asynchronous calibration borders', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.and.returnValue(response);
    const fixture = await mount(CalibrationComponent);
    response.next(frame);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('#calibration-border-top').style
        .transform
    ).toBe('translateY(17px)');
  });

  it('updates calibration enablement before the interaction stream emits', async () => {
    const response = new Subject<string>();
    processing.getStatus.and.returnValue(response);
    const fixture = await mount(CalibrationComponent);
    response.next('Active');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('#calibrations-interactions-toggle')
        .disabled
    ).toBeFalse();
    response.next('Inactive');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('#calibrations-interactions-toggle')
        .disabled
    ).toBeTrue();
  });

  it('renders calibrated interaction results after a live interaction arrives', async () => {
    processing.getStatus.and.returnValue(of('Active'));
    const response = new Subject<Interaction[]>();
    processing.getInteractions.and.returnValue(response);
    calibration.computeCalibratedAbsolutePosition.and.callFake(() =>
      of(interactionData())
    );
    const fixture = await mount(CalibrationComponent);
    (
      fixture.nativeElement.querySelector(
        '#calibrations-interactions-toggle'
      ) as HTMLInputElement
    ).click();
    await fixture.whenStable();
    response.next([structuredClone(interaction)]);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('input[title="select point"]')
    ).toBeTruthy();
    expect(text(fixture)).toContain('42');
  });

  it('renders network SignalR updates', async () => {
    settings.getSettings.and.returnValue(of(structuredClone(DEFAULT_SETTINGS)));
    const response = new Subject<string>();
    network.getStatus.and.returnValue(response);
    const fixture = await mount(NetworkComponent);
    response.next('Async network status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async network status');
  });

  it('renders TUIO SignalR updates', async () => {
    const response = new Subject<string>();
    tuio.getStatus.and.returnValue(response);
    const fixture = await mount(TuioComponent);
    response.next('Async TUIO status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async TUIO status');
  });

  it('renders TUIO package payloads', async () => {
    const response = new Subject<TuioPackageDetails>();
    tuio.getPackages.and.returnValue(response);
    const fixture = await mount(PackageDetailsComponent);
    response.next({
      sessionId: 42,
      frameId: 91,
      packageContent: 'Async TUIO package',
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async TUIO package');
    expect(text(fixture)).toContain('Frame Id: 91');
  });

  it('renders log polling emissions and detaches on destruction', async () => {
    const response = new Subject<LogMessageDetail>();
    log.getLogs.and.returnValue(response);
    const fixture = await mount(LogComponent);
    response.next({
      id: 42,
      formattedMessage: 'Async log message',
      level: LogLevel.Info,
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async log message');
    fixture.destroy();
    expect(response.observed).toBeFalse();
  });

  it('renders capture-state and sample-index polling independently', async () => {
    const capturing = new Subject<boolean>();
    const index = new Subject<number>();
    measure.isCapturing.and.returnValue(capturing);
    measure.getCurrentSampleIdx.and.returnValue(index);
    const fixture = await mount(MeasureControlsComponent);
    await new Promise((resolve) => setTimeout(resolve, 0));
    capturing.next(true);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Captured Frame');
    index.next(7);
    await fixture.whenStable();
    expect(text(fixture)).toContain('7 / 10');
  });

  it('updates the measurement viewport after frame-size responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.and.returnValue(response);
    const fixture = await mount(MeasureSurfaceComponent);
    (
      fixture.nativeElement.querySelector(
        '#visualization-toggle'
      ) as HTMLInputElement
    ).click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.measure__visualization').style.width
    ).toBe('640px');
  });

  it('renders recording progress delivered after the start request', async () => {
    recording.getStatus.and.returnValue(of(streaming));
    recording.startRecording.and.returnValue(of('/recordings/test'));
    const response = new Subject<RecordingStateUpdate>();
    recording.getRecordingState.and.returnValue(response);
    const fixture = await mount(RecordingComponent);
    (
      fixture.nativeElement.querySelector('.icon-radio-checked') as HTMLElement
    ).click();
    await fixture.whenStable();
    response.next({
      state: RecordingState.Recording,
      framesRecorded: 42,
      sessionName: 'default',
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Frames: 42');
    expect(fixture.nativeElement.querySelector('.icon-stop')).toBeTruthy();
    fixture.destroy();
    expect(response.observed).toBeFalse();
  });

  it('renders frame/history stream updates', async () => {
    processing.getStatus.and.returnValue(of('Active'));
    const frames = new Subject<InteractionFrame[]>();
    const history = new Subject<InteractionHistory[]>();
    processing.getFrames.and.returnValue(frames);
    processing.getHistory.and.returnValue(history);
    const fixture = await mount(HistoryComponent);
    frames.next([
      { frameId: 8123, interactions: [structuredClone(interaction)] },
    ]);
    history.next([
      {
        touchId: 42,
        items: [{ frameId: 9991, interaction: structuredClone(interaction) }],
      },
    ]);
    await fixture.whenStable();
    expect(text(fixture)).toContain('8123');
    expect(text(fixture)).toContain('9991');
  });

  it('renders a recording-stream failure after the start request', async () => {
    spyOn(console, 'error');
    recording.getStatus.and.returnValue(of(streaming));
    recording.startRecording.and.returnValue(of('/recordings/test'));
    const response = new Subject<RecordingStateUpdate>();
    recording.getRecordingState.and.returnValue(response);
    const fixture = await mount(RecordingComponent);
    (
      fixture.nativeElement.querySelector('.icon-radio-checked') as HTMLElement
    ).click();
    await fixture.whenStable();
    response.error(new Error('Test recording stream failed'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain(
      'Faulted'
    );
    expect(fixture.nativeElement.querySelector('.icon-stop')).toBeNull();
  });

  it('renders history stream emissions in SVG', async () => {
    processing.getStatus.and.returnValue(of('Active'));
    const response = new Subject<InteractionHistory[]>();
    processing.getHistory.and.returnValue(response);
    const fixture = await mount(HistoryVisualizationComponent);
    response.next([
      {
        touchId: 42,
        items: [{ frameId: 1, interaction: structuredClone(interaction) }],
      },
    ]);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('circle.history__point').length
    ).toBe(1);
  });

  it('renders imperative ViewChild interaction-table updates', async () => {
    const fixture = await mount(InteractionsComponent);
    fixture.componentInstance.updateInteractions(interactionData());
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
    expect(text(fixture)).toContain('42');
  });

  it('renders imperative ViewChild interaction-visualization updates', async () => {
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentInstance.updateCalibratedInteractions(interactionData());
    await fixture.whenStable();
    expect(text(fixture)).toContain('Count: 1');
    expect(
      fixture.nativeElement.querySelectorAll('.interactions__point').length
    ).toBe(1);
  });

  it('updates visualization frame geometry after HTTP responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.and.returnValue(response);
    const fixture = await mount(InteractionsVisualizationComponent);
    (
      fixture.nativeElement.querySelector(
        '#visualization-toggle'
      ) as HTMLInputElement
    ).click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.interactions__visualization').style
        .width
    ).toBe('640px');
  });

  it('renders WebSocket image frames and their counters', async () => {
    tracking.getStatus.and.returnValue(of(streaming));
    tracking.setDepthImagePreviewState.and.returnValue(of(true));
    const response = new Subject<MessageEvent>();
    websocket.createSocket.and.returnValue(new Subject<MessageEvent>());
    websocket.getResponseStream.and.returnValue(response);
    const fixture = await mount(DepthImageComponent);
    fixture.componentRef.setInput('livePreviewEnabled', true);
    await fixture.whenStable();
    (
      fixture.nativeElement.querySelector(
        '#checkbox-livePreviewDepthImage'
      ) as HTMLInputElement
    ).click();
    await fixture.whenStable();
    const image =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    response.next(new MessageEvent('message', { data: image }));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Frames: 1');
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      image
    );
  });

  it('renders point-cloud stream counters without depending on the WebGL loop', async () => {
    // This is a DOM scheduling test, not a GPU test. Exercise the component's
    // supported no-WebGL fallback so shader compilation cannot drive the test.
    spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(null);
    tracking.getStatus.and.returnValue(of(streaming));
    const response = new Subject<Point3[]>();
    pointCloud.getPointCloud.and.returnValue(response);
    const fixture = await mount(PointCloudComponent);
    fixture.componentRef.setInput('livePreviewEnabled', true);
    await fixture.whenStable();
    (
      fixture.nativeElement.querySelector(
        '#pointCloud-livePreview-toggle'
      ) as HTMLInputElement
    ).click();
    await fixture.whenStable();
    response.next([{ x: 1, y: 2, z: 3, isFiltered: false, isValid: true }]);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Frames: 1');
  });
});
