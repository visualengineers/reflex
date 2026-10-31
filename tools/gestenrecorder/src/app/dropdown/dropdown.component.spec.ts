import { ComponentFixture, TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../../test/helpers/dom';
import { setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent;
  let fixture: ComponentFixture<DropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: closes an opened dropdown through the document HostListener', () => {
  setupZonelessTests();

  it('closes an opened dropdown through the document HostListener', async () => {
    const fixture = TestBed.createComponent(DropdownComponent);
    await fixture.whenStable();
    queryElement((fixture.nativeElement as HTMLInputElement), '.dropdown_button').click();
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), 'app-savingoptions')
    ).not.toBeNull();
    document.body.click();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelector('app-savingoptions')).toBeNull();
  });
});
