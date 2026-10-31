import { AppVersionInfo } from '@reflex/shared-types';
import { Subject } from 'rxjs';
import {
  mount,
  setupTests as setupZonelessTests,
  text,
  version
} from '../test-utils/zoneless-change-detection.test-context';
import { HomeComponent } from './home.component';

describe('Zoneless change detection: renders HTTP version results through AsyncPipe', () => {
  setupZonelessTests();

  it('renders HTTP version results through AsyncPipe', async () => {
    const response = new Subject<AppVersionInfo>();
    version.getAppVersionInfo.mockReturnValue(response);
    const fixture = await mount(HomeComponent);
    response.next({ name: 'server', version: 'zoneless-version' });
    await fixture.whenStable();
    expect(text(fixture)).toContain('zoneless-version');
  });
});
