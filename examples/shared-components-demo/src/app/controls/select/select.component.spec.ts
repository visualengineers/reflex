import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../../test/helpers/dom';
import { SelectComponent } from './select.component';

describe('ValueSelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: clears the saved-filter notification when its timer expires', () => {
  it('clears the saved-filter notification when its timer expires', async () => {
    const fixture = TestBed.createComponent(SelectComponent);
    await fixture.whenStable();
    const select: HTMLSelectElement
      = queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), 'select');
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'savedFilter: Moving Average'
    );
    await new Promise((resolve) => setTimeout(resolve, 2100));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.content__header p').textContent
    ).toBe('');
  });
});
