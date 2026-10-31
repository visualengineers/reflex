import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { logService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should update focus borders correctly', () => {
    fixture.detectChanges();

    vi.spyOn(component, 'focusBorder');
    vi.spyOn(component, 'releaseBorder');
    vi.spyOn(component, 'releaseAllBorders');

    expect(vi.spyOn(component, 'focusBorder')).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'releaseBorder')).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'releaseAllBorders')).not.toHaveBeenCalled();

    expect(component['selectedBorderIndex']).toBe(-1);

    const background = fixture.debugElement.query(
      By.css('.calibration__background')
    ).nativeElement as HTMLElement;

    const border0 = fixture.debugElement.query(By.css('#calibration-border-top'))
      .nativeElement as HTMLElement;
    const border1 = fixture.debugElement.query(By.css('#calibration-border-left'))
      .nativeElement as HTMLElement;
    const border2 = fixture.debugElement.query(
      By.css('#calibration-border-bottom')
    ).nativeElement as HTMLElement;
    const border3 = fixture.debugElement.query(
      By.css('#calibration-border-right')
    ).nativeElement as HTMLElement;

    expect(background).toBeTruthy();
    expect(border0).toBeTruthy();
    expect(border1).toBeTruthy();
    expect(border2).toBeTruthy();
    expect(border3).toBeTruthy();

    border0.dispatchEvent(new Event('mousedown'));

    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledTimes(1);

    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledWith(0);
    expect(component['selectedBorderIndex']).toBe(0);

    border1.dispatchEvent(new Event('mousedown'));

    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledTimes(2);
    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledWith(1);
    expect(component['selectedBorderIndex']).toBe(1);

    background.dispatchEvent(new Event('mouseup'));

    expect(vi.spyOn(component, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(-1);

    border3.dispatchEvent(new Event('mousedown'));
    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledTimes(3);
    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledWith(3);
    expect(component['selectedBorderIndex']).toBe(3);

    border3.dispatchEvent(new Event('mouseup'));
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledTimes(1);
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledWith(3);
    expect(vi.spyOn(component, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(-1);

    border2.dispatchEvent(new Event('mousedown'));
    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledTimes(4);
    expect(vi.spyOn(component, 'focusBorder')).toHaveBeenCalledWith(2);
    expect(component['selectedBorderIndex']).toBe(2);

    border3.dispatchEvent(new Event('mouseup'));
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledTimes(2);
    expect(vi.spyOn(component, 'releaseBorder')).not.toHaveBeenCalledWith(2);
    expect(vi.spyOn(component, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(2);

    border1.dispatchEvent(new Event('mouseleave'));
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledTimes(3);
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledWith(1);
    expect(vi.spyOn(component, 'releaseBorder')).not.toHaveBeenCalledWith(2);
    expect(vi.spyOn(component, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(2);

    border2.dispatchEvent(new Event('mouseup'));
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledTimes(4);
    expect(vi.spyOn(component, 'releaseBorder')).toHaveBeenCalledWith(2);
    expect(vi.spyOn(component, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(-1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });
});
