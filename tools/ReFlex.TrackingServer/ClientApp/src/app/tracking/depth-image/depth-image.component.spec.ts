import { By } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import {
  mount,
  setupTests as setupZonelessTests,
  text,
  tracking,
  websocket
} from '../../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../../test-utils/zoneless-change-detection.test-data';
import { DepthImageComponent } from './depth-image.component';
import { component as testComponent, fixture as testFixture, setupTests } from './depth-image.component.test-context';
import { trackingService, wsMock } from './depth-image.component.test-data';

describe('Zoneless change detection: renders WebSocket image frames and their counters', () => {
  setupZonelessTests();

  it('renders WebSocket image frames and their counters', async () => {
    tracking.getStatus.mockReturnValue(of(streaming));
    tracking.setDepthImagePreviewState.mockReturnValue(of(true));
    const response = new Subject<MessageEvent>();
    websocket.createSocket.mockReturnValue(new Subject<MessageEvent>());
    websocket.getResponseStream.mockReturnValue(response);
    const fixture = await mount(DepthImageComponent);
    fixture.componentRef.setInput('livePreviewEnabled', true);
    await fixture.whenStable();

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#checkbox-livePreviewDepthImage')
      .click();
    await fixture.whenStable();
    const image
      = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    response.next(new MessageEvent('message', { data: image }));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Frames: 1');
    expect(queryElement((fixture.nativeElement as HTMLInputElement), 'img').getAttribute('src')).toBe(
      image
    );
  });
});

describe('DepthImageComponent', () => {
  setupTests();

  it('should create', () => {
    expect(testComponent).toBeTruthy();
  });

  it('should initialize correctly', () => {
    expect(testComponent).toBeTruthy();

    expect(testComponent.livePreview).toBe(false);
    expect(testComponent.livePreviewEnabled).toBe(false);
    expect(testComponent.numFramesReceived).toBe(0);

    expect(trackingService.getStatus).toHaveBeenCalledTimes(1);

    // if livePreview is false, container should not be defined
    expect(testComponent.container).toBeUndefined();
  });

  it('should emit fullscreenChanged', () => {
    expect(testComponent.fullScreen).toBe(false);

    const fullScreenChangedSpy = vi.spyOn(testComponent.fullScreenChanged, 'emit');

    testComponent.fullScreen = true;

    expect(testComponent.fullScreen).toBe(true);
    expect(fullScreenChangedSpy).toHaveBeenCalledTimes(1);
    expect(fullScreenChangedSpy).toHaveBeenCalledWith(true);
  });

  it('should update livePreview value', async () => {
    const livePreviewSpy = vi.spyOn(testComponent, 'livePreviewChanged');

    expect(testComponent).toBeTruthy();

    expect(testComponent.livePreview).toBe(false);
    expect(testComponent.numFramesReceived).toBe(0);

    testFixture.componentRef.setInput('livePreviewEnabled', true);
    testFixture.detectChanges();
    await testFixture.whenStable();
    testComponent.livePreview = true;

    expect(testComponent.livePreview).toBe(true);

    testFixture.componentRef.setInput('livePreviewEnabled', false);
    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(testComponent.livePreview).toBe(false);

    expect(livePreviewSpy).toHaveBeenCalled();

    testFixture.componentRef.setInput('livePreviewEnabled', true);
    testFixture.detectChanges();
    await testFixture.whenStable();

    const cbLivePreview = testFixture.debugElement.query(
      By.css('#checkbox-livePreviewDepthImage')
    ).nativeElement as HTMLInputElement;
    cbLivePreview.click();

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(livePreviewSpy).toHaveBeenCalledTimes(2);

    expect(testComponent.livePreview).toBe(true);

    expect(testComponent.container).toBeTruthy();
  });
});

async function verifyStage1(cbLivePreview: HTMLInputElement, livePreviewSpy: import('vitest').Mock<() => void>): Promise<void> {
  cbLivePreview.click();
  expect(livePreviewSpy).toHaveBeenCalledTimes(1);
  testFixture.detectChanges();
  await testFixture.whenStable();
  expect(testComponent.livePreview).toBe(true);
  cbLivePreview.checked = true;
  expect(testComponent['socket']).toBeTruthy();
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 1' })
  );
  expect(testComponent.imageData).toEqual('image 1');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 2' })
  );
  expect(testComponent.imageData).toEqual('image 2');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 3' })
  );
  expect(testComponent.imageData).toEqual('image 3');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 4' })
  );
  expect(testComponent.imageData).toEqual('image 4');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 5' })
  );
  expect(testComponent.imageData).toEqual('image 5');
}

async function verifyStage2(cbLivePreview: HTMLInputElement, livePreviewSpy: import('vitest').Mock<() => void>): Promise<void> {
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 6' })
  );
  expect(testComponent.imageData).toEqual('image 6');
  expect(testComponent.numFramesReceived).toBe(6);
  wsMock.requestSubject.next(new MessageEvent('mockedMessage'));
  expect(testComponent.imageData).toEqual('image 6');
  expect(testComponent.numFramesReceived).toBe(6);
  cbLivePreview.click();
  cbLivePreview.checked = false;
  testFixture.detectChanges();
  await testFixture.whenStable();
  expect(livePreviewSpy).toHaveBeenCalledTimes(2);
  expect(testComponent.livePreview).toBe(false);
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 7' })
  );
  expect(testComponent.imageData).toEqual('image 6');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 8' })
  );
  expect(testComponent.imageData).toEqual('image 6');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 9' })
  );
}

async function verifyStage3(cbLivePreview: HTMLInputElement, livePreviewSpy: import('vitest').Mock<() => void>): Promise<void> {
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 10' })
  );
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 11' })
  );
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 12' })
  );
  expect(testComponent.numFramesReceived).toBe(6);
  expect(testComponent.imageData).toEqual('image 6');
  cbLivePreview.click();
  cbLivePreview.checked = true;
  testFixture.detectChanges();
  await testFixture.whenStable();
  expect(livePreviewSpy).toHaveBeenCalledTimes(3);
  expect(testComponent.livePreview).toBe(true);
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 13' })
  );
  expect(testComponent.imageData).toEqual('image 13');
  wsMock.requestSubject.next(
    new MessageEvent('mockedMessage', { data: 'image 14' })
  );
  expect(testComponent.imageData).toEqual('image 14');
  expect(testComponent.numFramesReceived).toBe(8);
}

async function verifyScenario4(): Promise<void> {
  const livePreviewSpy = vi.spyOn(testComponent, 'livePreviewChanged');

  testFixture.componentRef.setInput('livePreviewEnabled', true);
  testFixture.detectChanges();
  await testFixture.whenStable();

  const cbLivePreview = testFixture.debugElement.query(
    By.css('#checkbox-livePreviewDepthImage')
  ).nativeElement as HTMLInputElement;

  await verifyStage1(cbLivePreview, livePreviewSpy);

  await verifyStage2(cbLivePreview, livePreviewSpy);

  await verifyStage3(cbLivePreview, livePreviewSpy);
}


describe('DepthImageComponent', () => {
  setupTests();

  it('should correctly subscribe to websocket', verifyScenario4);
});

describe('DepthImageComponent', () => {
  setupTests();

  it('should toggle fullscreen', async () => {
    expect(testComponent.fullScreen).toBe(false);

    expect(testComponent.livePreview).toBe(false);
    expect(testComponent.livePreviewEnabled).toBe(false);
    expect(testComponent.numFramesReceived).toBe(0);

    // if livePreview is false, container should not be defined
    expect(testComponent.container).toBeUndefined();

    testComponent.updateSize();
    testFixture.changeDetectorRef.markForCheck();

    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(testComponent.fullScreen).toBe(false);

    testFixture.componentRef.setInput('livePreviewEnabled', true);
    testFixture.detectChanges();
    await testFixture.whenStable();
    testComponent.livePreview = true;

    testComponent.livePreviewChanged();
    testFixture.changeDetectorRef.markForCheck();

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(testComponent.container).toBeDefined();

    expect((testComponent.container?.nativeElement as HTMLInputElement).classList).not.toContain(
      'fullScreen'
    );

    testComponent.fullScreen = true;

    testComponent.updateSize();
    testFixture.changeDetectorRef.markForCheck();

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect((testComponent.container?.nativeElement as HTMLInputElement).classList).toContain(
      'fullScreen'
    );

    testComponent.fullScreen = false;

    testComponent.updateSize();
    testFixture.changeDetectorRef.markForCheck();

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect((testComponent.container?.nativeElement as HTMLInputElement).classList).not.toContain(
      'fullScreen'
    );
  });
});
