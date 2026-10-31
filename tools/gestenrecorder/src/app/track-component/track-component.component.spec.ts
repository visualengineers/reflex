import { ComponentFixture, TestBed } from '@angular/core/testing';
import { gestures, setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { TrackComponentComponent } from './track-component.component';

describe('TrackComponentComponent', () => {
  let component: TrackComponentComponent;
  let fixture: ComponentFixture<TrackComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackComponentComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrackComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders a newly loaded gesture in the editable track table', () => {
  setupZonelessTests();

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
});
