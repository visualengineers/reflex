import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ConfigurationService } from '../service/configuration.service';
import { setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { CanvasComponent } from './canvas.component';

describe('CanvasComponent', () => {
  let component: CanvasComponent;
  let fixture: ComponentFixture<CanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: updates the canvas background binding after a service emission', () => {
  setupZonelessTests();

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
