import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ValueSelectionComponent } from './value-selection.component';

describe('ValueSelectionComponent', () => {
  let component: ValueSelectionComponent;
  let fixture: ComponentFixture<ValueSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueSelectionComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign default title', () => {
    const defaultTitle = '';

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${defaultTitle}`);
  });

  it('should set title correctly', () => {
    const testTitle = 'Value Selection - TestTitle';
    fixture.componentRef.setInput('elementTitle', testTitle);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${testTitle}`);
  });
});

describe('Zoneless change detection: renders updated inputs of ValueSelectionComponent', () => {
  it('renders updated inputs of ValueSelectionComponent', async () => {
    const fixture = TestBed.createComponent(
      ValueSelectionComponent
    );
    await fixture.whenStable();
    fixture.componentRef.setInput(
      'elementTitle',
      'Asynchronously updated title'
    );
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'Asynchronously updated title'
    );
  });
});
