import { DatePipe } from '@angular/common';
import { component, setupTests } from './interactions.component.test-context';

describe('InteractionsComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct timestamp', () => {
    const ticks = 638191569329269248;
    const expectedDate = new Date(Date.UTC(2023, 5, 8, 15, 35, 32, 926));

    const datepipe: DatePipe = new DatePipe('en-US', '+0000');
    const formattedDate = datepipe.transform(
      expectedDate,
      'HH:mm:ss.SSS'
    ) as string;

    const converted = component.getTime(ticks);
    expect(converted).toEqual(formattedDate);
  });
});
