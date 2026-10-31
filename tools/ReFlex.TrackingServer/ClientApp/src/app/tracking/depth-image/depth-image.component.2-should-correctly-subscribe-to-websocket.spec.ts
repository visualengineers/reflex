import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './depth-image.component.test-context';
import { wsMock } from './depth-image.component.test-data';


async function verifyStage1(cbLivePreview: HTMLInputElement, livePreviewSpy: import('vitest').Mock<() => void>): Promise<void> {
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
}

async function verifyStage2(cbLivePreview: HTMLInputElement, livePreviewSpy: import('vitest').Mock<() => void>): Promise<void> {
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
}

async function verifyScenario4(): Promise<void> {
  const livePreviewSpy = vi.spyOn(component, 'livePreviewChanged');

  fixture.componentRef.setInput('livePreviewEnabled', true);
  fixture.detectChanges();
  await fixture.whenStable();

  const cbLivePreview = fixture.debugElement.query(
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
