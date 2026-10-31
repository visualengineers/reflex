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
