import { ComponentFixture, TestBed } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { ValueTextComponent } from './value-text.component';

describe('ValueTextComponent', () => {
  let component: ValueTextComponent;
  let fixture: ComponentFixture<ValueTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueTextComponent]
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

  it('should assign default title', () => {
    const defaultTitle = '';

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${defaultTitle}`);
  });

  it('should set title correctly', () => {
    const testTitle = 'Value Text - TestTitle';
    fixture.componentRef.setInput('elementTitle', testTitle);

    fixture.detectChanges();

    const inputElem = fixture.debugElement.query(By.css('.settings__item--label'));
    expect((inputElem.nativeElement as HTMLInputElement).textContent).toEqual(`${testTitle}`);
  });
});
