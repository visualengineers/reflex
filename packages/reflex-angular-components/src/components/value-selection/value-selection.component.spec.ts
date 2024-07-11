import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueSelectionComponent } from './value-selection.component';
import { By } from '@angular/platform-browser';

describe('ValueSelectionComponent', () => {
  let component: ValueSelectionComponent;
  let fixture: ComponentFixture<ValueSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ValueSelectionComponent ]
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

  it ('should assign default title', () => {
    const defaultTitle = '';

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(inputElem.nativeElement.textContent).toEqual(`${defaultTitle}`);
  });

  it ('should set title correctly', () => {
    const testTitle = 'Value Selection - TestTitle';
    component.elementTitle = testTitle;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(inputElem.nativeElement.textContent).toEqual(`${testTitle}`);
  });
});
