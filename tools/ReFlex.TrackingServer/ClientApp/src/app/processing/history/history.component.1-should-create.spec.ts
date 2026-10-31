import { of, throwError } from 'rxjs';
import { component, fixture, setupTests } from './history.component.test-context';
import { frames, history, logService, processingService } from './history.component.test-data';

describe('HistoryComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(processingService.getHistory).toHaveBeenCalledTimes(1);
    expect(processingService.getFrames).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.frames).toEqual(frames);
    expect(component.history).toEqual(history);
  });

  it('should handle empty status', () => {
    processingService.getStatus.mockReturnValue(of(''));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should handle errors correctly: status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.mockReturnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);
  });

  it('should handle errors correctly: frames', () => {
    const errorFrames = 'TestError: processingService.getFrames';
    processingService.getFrames.mockReturnValue(throwError(errorFrames));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual(history);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrames);
  });

  it('should handle errors correctly: history', () => {
    const errorHistory = 'TestError: processingService.getHistory';
    processingService.getHistory.mockReturnValue(throwError(errorHistory));

    fixture.detectChanges();

    expect(component.frames).toEqual(frames);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorHistory);
  });
});
