import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueTextComponent } from './value-text.component';
import { By } from '@angular/platform-browser';

describe('ValueTextComponent', () => {
  let component: ValueTextComponent;
  let fixture: ComponentFixture<ValueTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ValueTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueTextComponent);
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
    const testTitle = 'Value Text - TestTitle';
    component.elementTitle = testTitle;

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect(inputElem.nativeElement.textContent).toEqual(`${testTitle}`);
  });
});
