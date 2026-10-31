import { TestBed } from '@angular/core/testing';
import { queryElement } from '../../../../test/helpers/dom';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'gestenrecorder' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('gestenrecorder');
  });

  it('should render gesture controls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.recorder__header > .settings__button-group > button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('Build');
    expect(queryElement<HTMLInputElement>(compiled, '#first-toggle-checkbox')).toBeTruthy();
  });
});
