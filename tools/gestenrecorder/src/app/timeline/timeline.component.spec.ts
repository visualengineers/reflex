import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  gestures,
  points,
  setupTests as setupZonelessTests
} from '../test-utils/zoneless-change-detection.test-context';
import { TimelineComponent } from './timeline.component';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: passes asynchronous gesture and point updates to the actual Plotly view', () => {
  setupZonelessTests();

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
});
