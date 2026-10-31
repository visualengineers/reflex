import { Point3 } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
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
