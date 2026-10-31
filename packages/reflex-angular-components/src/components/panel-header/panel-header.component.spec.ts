import { TestBed } from '@angular/core/testing';
import { PanelHeaderComponent } from './panel-header.component';

describe('Zoneless change detection: renders updated inputs of PanelHeaderComponent', () => {
  it('renders updated inputs of PanelHeaderComponent', async () => {
    const fixture = TestBed.createComponent(
      PanelHeaderComponent
    );
    await fixture.whenStable();
    fixture.componentRef.setInput(
      'elementTitle',
      'Asynchronously updated title'
    );
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'Asynchronously updated title'
    );
  });
});
