import { mount, setupTests as setupZonelessTests, text } from '../../test-utils/zoneless-change-detection.test-context';
import { interactionData } from '../../test-utils/zoneless-change-detection.test-data';
import { InteractionsComponent } from './interactions.component';

describe('Zoneless change detection: renders imperative ViewChild interaction-table updates', () => {
  setupZonelessTests();

  it('renders imperative ViewChild interaction-table updates', async () => {
    const fixture = await mount(InteractionsComponent);
    fixture.componentInstance.updateInteractions(interactionData());
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelectorAll('tbody tr').length).toBe(3);
    expect(text(fixture)).toContain('42');
  });
});
