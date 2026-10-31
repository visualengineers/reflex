import { DEFAULT_SETTINGS } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import {
  mount,
  network,
  settings,
  setupTests as setupZonelessTests,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { NetworkComponent } from './network.component';

describe('Zoneless change detection: renders network SignalR updates', () => {
  setupZonelessTests();

  it('renders network SignalR updates', async () => {
    settings.getSettings.mockReturnValue(of(structuredClone(DEFAULT_SETTINGS)));
    const response = new Subject<string>();
    network.getStatus.mockReturnValue(response);
    const fixture = await mount(NetworkComponent);
    response.next('Async network status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async network status');
  });
});
