import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ConfigurationService } from '../service/configuration.service';
import { setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { TouchAreaService } from './service/touch-area.service';
import { TouchAreaComponent } from './touch-area.component';

describe('TouchAreaComponent', () => {
  let component: TouchAreaComponent;
  let fixture: ComponentFixture<TouchAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TouchAreaComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TouchAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: updates the touch-area background after a service emission', () => {
  setupZonelessTests();

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

describe('Zoneless change detection: updates hover-menu inputs and visibility after native canvas events', () => {
  setupZonelessTests();

  it('updates hover-menu inputs and visibility after native canvas events', async () => {
    const area = TestBed.inject(TouchAreaService);
    const hovered = vi.spyOn(area, 'getHoveredCircles').mockReturnValue([0]);
    const fixture = TestBed.createComponent(TouchAreaComponent);
    await fixture.whenStable();
    const config = TestBed.inject(ConfigurationService);
    config.setNormalizedPoints([{ index: 0, x: 0.25, y: 0.5, z: 1, time: 0 }]);
    const canvas: HTMLCanvasElement
      = queryElement<HTMLCanvasElement>((fixture.nativeElement as HTMLInputElement), 'canvas');
    canvas.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 10, clientY: 20 })
    );
    await fixture.whenStable();
    const x: HTMLInputElement = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'input[id="hoveredPoint.x"]');
    expect(x.value).toBe('0.25');
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), 'app-hover-menu button').textContent
    ).toContain('Lösen');
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
    await fixture.whenStable();
    hovered.mockReturnValue([]);
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelector('.hover-menu')).toBeNull();
  });
});
