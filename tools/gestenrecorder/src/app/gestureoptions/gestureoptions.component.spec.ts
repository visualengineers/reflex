import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ConfigurationService } from '../service/configuration.service';
import { setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { GestureoptionsComponent } from './gestureoptions.component';

describe('GestureoptionsComponent', () => {
  let component: GestureoptionsComponent;
  let fixture: ComponentFixture<GestureoptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestureoptionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GestureoptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders layer changes received by the gesture options', () => {
  setupZonelessTests();

  it('renders layer changes received by the gesture options', async () => {
    const fixture = TestBed.createComponent(GestureoptionsComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setLayers({
      up: 12,
      down: 7,
      colorUp: '#123456',
      colorDown: '#654321'
    });
    await fixture.whenStable();
    expect(queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#layersUp').value).toBe('12');
  });
});
