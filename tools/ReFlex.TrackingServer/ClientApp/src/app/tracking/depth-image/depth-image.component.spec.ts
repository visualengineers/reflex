import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { TrackingService } from 'src/shared/services/tracking.service';
import { WebSocketService } from 'src/shared/services/webSocket.service';
import { WebSocketServiceMock } from 'src/shared/services/webSocket.service.mock';

import { DepthImageComponent } from './depth-image.component';
import { DepthCameraState, TrackingConfigState } from '@reflex/shared-types';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus'),
  setDepthImagePreviewState: vi
    .fn()
    .mockName('fakeTrackingService.setDepthImagePreviewState'),
};

const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming],
};

trackingService.getStatus.mockReturnValue(of(state));
trackingService.setDepthImagePreviewState.mockReturnValue(of(true));

const subject = new Subject<MessageEvent>();
const wsMock = new WebSocketServiceMock(subject, 'mockedMessage');

describe('DepthImageComponent', () => {
  let component: DepthImageComponent;
  let fixture: ComponentFixture<DepthImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, DepthImageComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService,
        },
        {
          provide: WebSocketService,
          useValue: wsMock,
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost',
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    trackingService.getStatus.mockClear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize correctly', async () => {
    expect(component).toBeTruthy();

    expect(component.livePreview).toBe(false);
    expect(component.livePreviewEnabled).toBe(false);
    expect(component.numFramesReceived).toBe(0);

    expect(trackingService.getStatus).toHaveBeenCalledTimes(1);

    // if livePreview is false, container should not be defined
    expect(component.container).toBeUndefined();
  });

  it('should emit fullscreenChanged', () => {
    expect(component.fullScreen).toBe(false);

    const fullScreenChangedSpy = vi.spyOn(component.fullScreenChanged, 'emit');

    component.fullScreen = true;

    expect(component.fullScreen).toBe(true);
    expect(fullScreenChangedSpy).toHaveBeenCalledTimes(1);
    expect(fullScreenChangedSpy).toHaveBeenCalledWith(true);
  });

  it('should update livePreview value', async () => {
    const livePreviewSpy = vi.spyOn(component, 'livePreviewChanged');

    expect(component).toBeTruthy();

    expect(component.livePreview).toBe(false);
    expect(component.numFramesReceived).toBe(0);

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.livePreview = true;

    expect(component.livePreview).toBe(true);

    fixture.componentRef.setInput('livePreviewEnabled', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.livePreview).toBe(false);

    expect(livePreviewSpy).toHaveBeenCalled();

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();

    let cbLivePreview = fixture.debugElement.query(
      By.css('#checkbox-livePreviewDepthImage')
    ).nativeElement as HTMLInputElement;
    cbLivePreview.click();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(livePreviewSpy).toHaveBeenCalledTimes(2);

    expect(component.livePreview).toBe(true);

    expect(component.container).toBeTruthy();
  });

  it('should correctly subscribe to websocket', async () => {
    const livePreviewSpy = vi.spyOn(component, 'livePreviewChanged');

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();

    let cbLivePreview = fixture.debugElement.query(
      By.css('#checkbox-livePreviewDepthImage')
    ).nativeElement as HTMLInputElement;
    cbLivePreview.click();

    expect(livePreviewSpy).toHaveBeenCalledTimes(1);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.livePreview).toBe(true);
    cbLivePreview.checked = true;

    expect(component['socket']).toBeTruthy();

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 1' })
    );

    expect(component.imageData).toEqual('image 1');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 2' })
    );

    expect(component.imageData).toEqual('image 2');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 3' })
    );

    expect(component.imageData).toEqual('image 3');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 4' })
    );

    expect(component.imageData).toEqual('image 4');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 5' })
    );

    expect(component.imageData).toEqual('image 5');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 6' })
    );

    expect(component.imageData).toEqual('image 6');

    expect(component.numFramesReceived).toBe(6);

    wsMock.requestSubject.next(new MessageEvent('mockedMessage'));

    expect(component.imageData).toEqual('image 6');

    expect(component.numFramesReceived).toBe(6);

    cbLivePreview.click();
    cbLivePreview.checked = false;

    fixture.detectChanges();
    await fixture.whenStable();

    expect(livePreviewSpy).toHaveBeenCalledTimes(2);
    expect(component.livePreview).toBe(false);

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 7' })
    );

    expect(component.imageData).toEqual('image 6');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 8' })
    );

    expect(component.imageData).toEqual('image 6');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 9' })
    );
    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 10' })
    );
    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 11' })
    );
    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 12' })
    );

    expect(component.numFramesReceived).toBe(6);

    expect(component.imageData).toEqual('image 6');

    cbLivePreview.click();
    cbLivePreview.checked = true;

    fixture.detectChanges();
    await fixture.whenStable();

    expect(livePreviewSpy).toHaveBeenCalledTimes(3);
    expect(component.livePreview).toBe(true);

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 13' })
    );

    expect(component.imageData).toEqual('image 13');

    wsMock.requestSubject.next(
      new MessageEvent('mockedMessage', { data: 'image 14' })
    );

    expect(component.imageData).toEqual('image 14');

    expect(component.numFramesReceived).toBe(8);
  });

  it('should toggle fullscreen', async () => {
    expect(component.fullScreen).toBe(false);

    expect(component.livePreview).toBe(false);
    expect(component.livePreviewEnabled).toBe(false);
    expect(component.numFramesReceived).toBe(0);

    // if livePreview is false, container should not be defined
    expect(component.container).toBeUndefined();

    component.updateSize();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.fullScreen).toBe(false);

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.livePreview = true;

    component.livePreviewChanged();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.container).toBeDefined();

    expect(component.container?.nativeElement.classList).not.toContain(
      'fullScreen'
    );

    component.fullScreen = true;

    component.updateSize();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.container?.nativeElement.classList).toContain(
      'fullScreen'
    );

    component.fullScreen = false;

    component.updateSize();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.container?.nativeElement.classList).not.toContain(
      'fullScreen'
    );
  });
});
