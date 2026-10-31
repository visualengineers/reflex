import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fileNames, setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { SavingoptionsComponent } from './savingoptions.component';

describe('SavingoptionsComponent', () => {
  let component: SavingoptionsComponent;
  let fixture: ComponentFixture<SavingoptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingoptionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SavingoptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders asynchronously loaded gesture file names', () => {
  setupZonelessTests();

  it('renders asynchronously loaded gesture file names', async () => {
    const fixture = TestBed.createComponent(SavingoptionsComponent);
    await fixture.whenStable();
    fileNames.next(['new-gesture.json', 'another-gesture.json']);
    await fixture.whenStable();
    const options = (fixture.nativeElement as HTMLInputElement).querySelectorAll(
      '#gestureFileNames option'
    );
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('new-gesture.json');
    fixture.destroy();
    expect(fileNames.observed).toBe(false);
  });
});
