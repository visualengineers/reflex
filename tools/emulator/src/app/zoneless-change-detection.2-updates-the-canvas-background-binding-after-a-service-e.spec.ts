import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../test/helpers/dom';
import { CanvasComponent } from './canvas/canvas.component';
import { ConfigurationService } from './service/configuration.service';
import { setupTests } from './zoneless-change-detection.test-context';

describe('Zoneless change detection', () => {
  setupTests();

  it('updates the canvas background binding after a service emission', async () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const config = TestBed.inject(ConfigurationService);
    await fixture.whenStable();
    config.setBackgroundImage('assets/new-background.png');
    await fixture.whenStable();
    expect(
      queryElement<HTMLCanvasElement>((fixture.nativeElement as HTMLInputElement), 'canvas').style.backgroundImage
    ).toContain('assets/new-background.png');
    fixture.destroy();
    expect(config.background$.observed).toBe(false);
    expect(config.background$.closed).toBe(false);
    expect(config.amountTouchPoints$.closed).toBe(false);
  });
});
