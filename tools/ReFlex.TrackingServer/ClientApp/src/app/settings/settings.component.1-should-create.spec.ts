import {
  PerformanceData
} from '@reflex/shared-types';
import { Subject } from 'rxjs';
import { component, fixture, setupTests } from './settings.component.test-context';
import { logService, performanceService } from './settings.component.test-data';

describe('SettingsComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('combines partial performance frames and updates existing chart entries', async () => {
    const updates = new Subject<PerformanceData>();
    performanceService.getData.mockReturnValue(updates);
    await fixture.whenStable();
    updates.next({
      data: [
        {
          frameId: 1,
          frameStart: 1000,
          frameEnd: 5000,
          totalFrameTime: 0,
          boxFilter: 2,
          valueFilter: 3
        }
      ]
    });
    await fixture.whenStable();
    expect(component.performanceDataFilterVis[0].totalFilter).toBe(5);

    updates.next({
      data: [
        {
          frameId: 1,
          frameStart: 2000,
          frameEnd: 6000,
          totalFrameTime: 0,
          processingPreparation: 4,
          processingConvert: 5
        }
      ]
    });
    await fixture.whenStable();
    expect(component.performanceDataProcessingVis[0].totalProcessing).toBe(9);
    expect(
      component.performanceDataCompleteTimeFrameVis[0].totalFrameTime
    ).toBe(5);

    updates.next({
      data: [
        {
          frameId: 1,
          frameStart: 0,
          frameEnd: 4000,
          totalFrameTime: 0,
          boxFilter: 7
        }
      ]
    });
    await fixture.whenStable();
    expect(component.performanceDataFilterVis.length).toBe(1);
    expect(component.performanceDataFilterVis[0].totalFilter).toBe(7);
    expect(component.performanceDataProcessingVis.length).toBe(1);
    expect(component.performanceDataCompleteTimeFrameVis.length).toBe(1);
    expect(component.performanceDataCompleteTimeFrameVis[0].frameStart).toBe(0);
    expect(component.performanceDataCompleteTimeFrameVis[0].frameEnd).toBe(
      5000
    );
    expect(
      component.performanceDataCompleteTimeFrameVis[0].totalFrameTime
    ).toBe(5);
  });
});
