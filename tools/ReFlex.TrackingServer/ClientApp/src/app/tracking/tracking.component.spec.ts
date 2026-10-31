import { DepthCamera, DepthCameraState, TrackingConfigState } from '@reflex/shared-types';
import { Subject } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  isolateTracking,
  mount,
  setupTests as setupZonelessTests,
  tracking,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../test-utils/zoneless-change-detection.test-data';
import { TrackingComponent } from './tracking.component';

describe('Zoneless change detection: renders a delayed camera-list HTTP response', () => {
  setupZonelessTests();

  it('renders a delayed camera-list HTTP response', async () => {
    isolateTracking();
    const response = new Subject<Array<DepthCamera>>();
    tracking.getCameras.mockReturnValue(response);
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
          framerate: 30
        }
      }
    ]);
    await fixture.whenStable();
    expect(
      queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), '#tracking-camera-select').textContent
    ).toContain('Async camera');
  });
});

describe('Zoneless change detection: renders SignalR camera status without another UI event', () => {
  setupZonelessTests();

  it('renders SignalR camera status without another UI event', async () => {
    isolateTracking();
    const status = new Subject<TrackingConfigState>();
    tracking.getStatus.mockReturnValue(status);
    const fixture = await mount(TrackingComponent);
    status.next(streaming);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Streaming');
  });
});
