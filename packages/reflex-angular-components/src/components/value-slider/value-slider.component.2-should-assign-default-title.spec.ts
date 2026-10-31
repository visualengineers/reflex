import { By } from '@angular/platform-browser';
import { fixture, setupTests } from './value-slider.component.test-context';

describe('ValueSliderComponent', () => {
  setupTests();

  it('should assign default title', () => {
    const defaultTitle = 'Custom Value';

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect((rangeElem.nativeElement as HTMLInputElement).getAttribute('title')).toContain(
      `${defaultTitle}`
    );

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('title')).toContain(
      `${defaultTitle}`
    );

    const labelElem = fixture.debugElement.query(
      By.css('.settings__item--label')
    );
    expect((labelElem.nativeElement as HTMLInputElement).textContent).toContain(`${defaultTitle}`);
  });

  it('should set title correctly', () => {
    const testTitle = 'ValueSlider - TestTitle';
    fixture.componentRef.setInput('elementTitle', testTitle);

    fixture.detectChanges();

    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    expect((rangeElem.nativeElement as HTMLInputElement).getAttribute('title')).toContain(
      `${testTitle}`
    );

    const inputElem = fixture.debugElement.query(By.css('.custom-input'));
    expect((inputElem.nativeElement as HTMLInputElement).getAttribute('title')).toContain(
      `${testTitle}`
    );

    const labelElem = fixture.debugElement.query(
      By.css('.settings__item--label')
    );
    expect((labelElem.nativeElement as HTMLInputElement).textContent).toContain(`${testTitle}`);
  });

  it('should assign default range values', async () => {
    const rangeElem = fixture.debugElement.query(By.css('.custom-range'));
    const minElem = fixture.debugElement.query(
      By.css('.settings__item--valueMin')
    );
    const maxElem = fixture.debugElement.query(
      By.css('.settings__item--valueMax')
    );
    const unitElem = fixture.debugElement.query(
      By.css('.settings__item--unit')
    );
    const inputElem = fixture.debugElement.query(By.css('.custom-input'));

    await await fixture.whenStable();

    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).min)).toEqual(0);
    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).max)).toEqual(10);
    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).step)).toEqual(1);
    expect(parseInt((rangeElem.nativeElement as HTMLInputElement).value)).toEqual(0);
    expect(parseInt((inputElem.nativeElement as HTMLInputElement).value)).toEqual(0);

    expect((minElem.nativeElement as HTMLInputElement).textContent).toEqual(`${0}`);
    expect((maxElem.nativeElement as HTMLInputElement).textContent).toEqual(`${10}`);
    expect((unitElem.nativeElement as HTMLInputElement).textContent).toEqual(``);
  });
});
