import {
  FrameSizeDefinition,
  Point3
} from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../test/helpers/dom';
import { InteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component';
import { DepthImageComponent } from './tracking/depth-image/depth-image.component';
import { PointCloudComponent } from './tracking/point-cloud/point-cloud.component';
import { calibration, mount, pointCloud, setupTests, text, tracking, websocket } from './zoneless-change-detection.test-context';
import { frame, streaming } from './zoneless-change-detection.test-data';

describe('TrackingServer zoneless DOM updates', () => {
  setupTests();

  it('updates visualization frame geometry after HTTP responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(InteractionsVisualizationComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#visualization-toggle')
      .click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.interactions__visualization').style
        .width
    ).toBe('640px');
  });

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
