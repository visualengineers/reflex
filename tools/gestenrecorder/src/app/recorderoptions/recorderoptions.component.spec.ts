import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ConfigurationService } from '../service/configuration.service';
import { setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { RecorderoptionsComponent } from './recorderoptions.component';

describe('RecorderoptionsComponent', () => {
  let component: RecorderoptionsComponent;
  let fixture: ComponentFixture<RecorderoptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecorderoptionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RecorderoptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders touch-count changes received by the recorder options', () => {
  setupZonelessTests();

  it('renders touch-count changes received by the recorder options', async () => {
    const fixture = TestBed.createComponent(RecorderoptionsComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setAmoutTouchPoints(17);
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#max-amountTouchPoints').value
    ).toBe('17');
  });
});
