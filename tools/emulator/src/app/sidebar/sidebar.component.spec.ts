import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { ConfigurationService } from '../service/configuration.service';
import { ConnectionService } from '../service/connection.service';
import { setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders asynchronous touch-count and backup timestamp changes', () => {
  setupZonelessTests();

  it('renders asynchronous touch-count and backup timestamp changes', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const config = TestBed.inject(ConfigurationService);
    await fixture.whenStable();
    config.setAmountTouchPoints(17);
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#amountTouchPoints').value
    ).toBe('17');
    config.backupTimestamp$.next(new Date('2030-04-05T12:00:00Z'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain('2030');
    fixture.destroy();
    expect(config.backupTimestamp$.observed).toBe(false);
    expect(config.backupTimestamp$.closed).toBe(false);
  });
});

describe('Zoneless change detection: renders new layer objects and in-place layer mutations', () => {
  setupZonelessTests();

  it('renders new layer objects and in-place layer mutations', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const config = TestBed.inject(ConfigurationService);
    await fixture.whenStable();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    click.preventDefault(); // Exercise the Angular handler without navigating Karma's iframe.
    (fixture.nativeElement as HTMLInputElement).querySelectorAll('.nav-link')[1].dispatchEvent(click);
    await fixture.whenStable();
    const layers = {
      up: 12,
      down: 7,
      colorUp: '#123456',
      colorDown: '#654321'
    };
    config.setLayers(layers);
    await fixture.whenStable();
    expect(queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#layersUp').value).toBe('12');
    layers.up = 13;
    config.setLayers(layers);
    await fixture.whenStable();
    expect(queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#layersUp').value).toBe('13');
  });
});

describe('Zoneless change detection: keeps the native WebSocket connection indicator working', () => {
  setupZonelessTests();

  it('keeps the native WebSocket connection indicator working', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    await fixture.whenStable();
    const state = TestBed.inject(ConnectionService)
      .connectionSuccessful;
    state.next(true);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.connection-indicator').classList
    ).toContain('success');
    state.next(false);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.connection-indicator').classList
    ).toContain('error');
  });
});
