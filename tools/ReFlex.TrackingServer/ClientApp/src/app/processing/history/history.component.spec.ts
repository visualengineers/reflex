import { InteractionFrame, InteractionHistory } from '@reflex/shared-types';
import { Subject, of, throwError } from 'rxjs';
import {
  mount,
  processing,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { interaction } from '../../test-utils/zoneless-change-detection.test-data';
import { HistoryComponent } from './history.component';
import { component as testComponent, fixture as testFixture, setupTests } from './history.component.test-context';
import { frames, history, logService, processingService } from './history.component.test-data';

describe('Zoneless change detection: renders frame/history stream updates', () => {
  setupZonelessTests();

  it('renders frame/history stream updates', async () => {
    processing.getStatus.mockReturnValue(of('Active'));
    const framesSubject = new Subject<Array<InteractionFrame>>();
    const historySubject = new Subject<Array<InteractionHistory>>();
    processing.getFrames.mockReturnValue(framesSubject);
    processing.getHistory.mockReturnValue(historySubject);
    const fixture = await mount(HistoryComponent);
    framesSubject.next([{ frameId: 8123, interactions: [structuredClone(interaction)] }]);
    historySubject.next([
      {
        touchId: 42,
        items: [{ frameId: 9991, interaction: structuredClone(interaction) }]
      }
    ]);
    await fixture.whenStable();
    expect(text(fixture)).toContain('8123');
    expect(text(fixture)).toContain('9991');
  });
});

describe('HistoryComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(processingService.getHistory).toHaveBeenCalledTimes(1);
    expect(processingService.getFrames).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(testComponent.frames).toEqual(frames);
    expect(testComponent.history).toEqual(history);
  });

  it('should handle empty status', () => {
    processingService.getStatus.mockReturnValue(of(''));

    testFixture.detectChanges();

    expect(testComponent.frames).toEqual([]);
    expect(testComponent.history).toEqual([]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should handle errors correctly: status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.mockReturnValue(throwError(errorStatus));

    testFixture.detectChanges();

    expect(testComponent.frames).toEqual([]);
    expect(testComponent.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);
  });

  it('should handle errors correctly: frames', () => {
    const errorFrames = 'TestError: processingService.getFrames';
    processingService.getFrames.mockReturnValue(throwError(errorFrames));

    testFixture.detectChanges();

    expect(testComponent.frames).toEqual([]);
    expect(testComponent.history).toEqual(history);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrames);
  });

  it('should handle errors correctly: history', () => {
    const errorHistory = 'TestError: processingService.getHistory';
    processingService.getHistory.mockReturnValue(throwError(errorHistory));

    testFixture.detectChanges();

    expect(testComponent.frames).toEqual(frames);
    expect(testComponent.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorHistory);
  });
});
