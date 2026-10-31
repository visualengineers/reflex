import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './network.component.test-context';
import { logService, networkService, settingsService } from './network.component.test-data';

describe('NetworkComponent', () => {
  setupTests();

  it('should handle errors correctly: Settings cannot be retrieved', async () => {
    const errorSettings = 'TesError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    fixture.detectChanges();
    await await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).not.toHaveBeenCalled();
    expect(networkService.getStatus).not.toHaveBeenCalled();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
  });

  it('should handle errors correctly: Networking service not available', async () => {
    const errorValues = 'TesError: networkService.getStatusValues';
    networkService.getStatusValues.mockReturnValue(throwError(errorValues));

    const errorStatus = 'TesError: networkService.getStatus';
    networkService.getStatus.mockReturnValue(throwError(errorStatus));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(networkService.getStatusValues).toHaveBeenCalledTimes(1);
    expect(networkService.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorValues);
  });
});
