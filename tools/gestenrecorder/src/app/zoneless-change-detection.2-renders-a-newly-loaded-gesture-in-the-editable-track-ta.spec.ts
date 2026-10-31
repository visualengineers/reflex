import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../test/helpers/dom';
import { ConfigurationService } from './service/configuration.service';
import { TimelineComponent } from './timeline/timeline.component';
import { TouchAreaComponent } from './touch-area/touch-area.component';
import { TrackComponentComponent } from './track-component/track-component.component';
import { gestures, points, setupTests } from './zoneless-change-detection.test-context';

describe('Zoneless change detection', () => {
  setupTests();

  it('renders a newly loaded gesture in the editable track table', async () => {
    const fixture = TestBed.createComponent(TrackComponentComponent);
    await fixture.whenStable();
    gestures.next({
      id: 42,
      name: 'Loaded gesture',
      numFrames: 71,
      speed: 2,
      tracks: []
    });
    await fixture.whenStable();
    const inputs = (fixture.nativeElement as HTMLInputElement).querySelectorAll<HTMLInputElement>('tbody input');
    expect([...inputs].map((e) => e.value)).toEqual([
      '42',
      'Loaded gesture',
      '71',
      '2'
    ]);
    fixture.destroy();
    expect(gestures.observed).toBe(false);
  });

  it('passes asynchronous gesture and point updates to the actual Plotly view', async () => {
    const fixture = TestBed.createComponent(TimelineComponent);
    await fixture.whenStable();
    gestures.next({
      id: 42,
      name: 'Loaded gesture',
      numFrames: 3,
      speed: 1,
      tracks: []
    });
    points.next([
      { x: 1, y: 2, z: 0.5 },
      { x: 2, y: 3, z: -0.5 }
    ]);
    await fixture.whenStable();
    // Plotly finishes its own asynchronous drawing after Angular updates its inputs.
    for (
      let attempt = 0;
      attempt < 40
      && (fixture.nativeElement as HTMLInputElement).querySelectorAll('.scatterlayer .point').length
        !== 2;
      attempt++
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    expect(
      (fixture.nativeElement as HTMLInputElement).querySelectorAll('.scatterlayer .point').length
    ).toBe(2);
    fixture.destroy();
    expect(gestures.observed).toBe(false);
    expect(points.observed).toBe(false);
  });

  it('updates the touch-area background after a service emission', async () => {
    const fixture = TestBed.createComponent(TouchAreaComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setBackgroundImage(
      'assets/new-background.png'
    );
    await fixture.whenStable();
    expect(
      queryElement<HTMLCanvasElement>((fixture.nativeElement as HTMLInputElement), 'canvas').style.backgroundImage
    ).toContain('assets/new-background.png');
  });
});
