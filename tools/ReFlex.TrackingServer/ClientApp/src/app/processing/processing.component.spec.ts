import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  mount,
  processing,
  setupTests as setupZonelessTests
} from '../test-utils/zoneless-change-detection.test-context';
import { HistoryComponent } from './history/history.component';
import { MockHistoryComponent } from './history/history.component.mock';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import { MockInteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component.mock';
import { InteractionsComponent } from './interactions/interactions.component';
import { MockInteractionsComponent } from './interactions/interactions.component.mock';
import { ProcessingComponent } from './processing.component';

describe('Zoneless change detection: renders processing status even when no interactions arrive', () => {
  setupZonelessTests();

  it('renders processing status even when no interactions arrive', async () => {
    TestBed.overrideComponent(ProcessingComponent, {
      remove: {
        imports: [
          InteractionsComponent,
          InteractionsVisualizationComponent,
          HistoryComponent
        ]
      },
      add: {
        imports: [
          MockInteractionsComponent,
          MockInteractionsVisualizationComponent,
          MockHistoryComponent
        ]
      }
    });
    const response = new Subject<string>();
    processing.getStatus.mockReturnValue(response);
    const fixture = await mount(ProcessingComponent);
    response.next('Active');
    await fixture.whenStable();
    expect(queryElement((fixture.nativeElement as HTMLInputElement), 'h3').textContent).toContain(
      'Active'
    );
  });
});
