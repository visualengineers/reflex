import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../test/helpers/dom';
import { App } from './app';
import { interaction, points, setupTests } from './zoneless-change-detection.test-context';

describe('Zoneless change detection', () => {
  setupTests();

  it('updates touch positions after a native window resize without another WebSocket frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    points.next([interaction(42, 0.5, 0.25, 1)]);
    await fixture.whenStable();
    const canvas = queryElement((fixture.nativeElement as HTMLInputElement), '.content');
    Object.defineProperty(canvas, 'offsetWidth', {
      value: 1000,
      configurable: true
    });
    Object.defineProperty(canvas, 'offsetHeight', {
      value: 800,
      configurable: true
    });
    window.dispatchEvent(new Event('resize'));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.touchPoint').style.transform
    ).toContain('translate(500px, 200px)');
  });
});
