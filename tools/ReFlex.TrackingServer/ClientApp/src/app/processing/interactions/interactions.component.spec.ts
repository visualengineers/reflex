import { DatePipe } from '@angular/common';
import { mount, setupTests as setupZonelessTests, text } from '../../test-utils/zoneless-change-detection.test-context';
import { interactionData } from '../../test-utils/zoneless-change-detection.test-data';
import { InteractionsComponent } from './interactions.component';
import { component as testComponent, largeData, setupTests, smallData } from './interactions.component.test-context';

describe('Zoneless change detection: renders imperative ViewChild interaction-table updates', () => {
  setupZonelessTests();

  it('renders imperative ViewChild interaction-table updates', async () => {
    const fixture = await mount(InteractionsComponent);
    fixture.componentInstance.updateInteractions(interactionData());
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelectorAll('tbody tr').length).toBe(3);
    expect(text(fixture)).toContain('42');
  });
});

describe('InteractionsComponent', () => {
  setupTests();

  it('should create', () => {
    expect(testComponent).toBeTruthy();
  });

  it('should return correct timestamp', () => {
    const ticks = 638191569329269248;
    const expectedDate = new Date(Date.UTC(2023, 5, 8, 15, 35, 32, 926));

    const datepipe: DatePipe = new DatePipe('en-US', '+0000');
    const formattedDate = datepipe.transform(
      expectedDate,
      'HH:mm:ss.SSS'
    ) as string;

    const converted = testComponent.getTime(ticks);
    expect(converted).toEqual(formattedDate);
  });
});

describe('InteractionsComponent', () => {
  setupTests();

  it('should update interactions', () => {
    testComponent.updateInteractions(largeData);

    expect(testComponent.interactions.raw).toHaveLength(10);
    expect(testComponent.interactions.absolute).toHaveLength(10);
    expect(testComponent.interactions.normalized).toHaveLength(10);

    for (let i = 0; i < 10; i++) {
      expect(testComponent.interactions.raw[i]).toEqual(largeData.raw[i]);
      expect(testComponent.interactions.normalized[i]).toEqual(
        largeData.normalized[i]
      );
      expect(testComponent.interactions.absolute[i]).toEqual(largeData.absolute[i]);
    }

    testComponent.updateInteractions(smallData);

    expect(testComponent.interactions.raw).toHaveLength(4);
    expect(testComponent.interactions.absolute).toHaveLength(4);
    expect(testComponent.interactions.normalized).toHaveLength(4);

    for (let i = 0; i < 4; i++) {
      expect(testComponent.interactions.raw[i]).toEqual(smallData.raw[i]);
      expect(testComponent.interactions.normalized[i]).toEqual(
        smallData.normalized[i]
      );
      expect(testComponent.interactions.absolute[i]).toEqual(smallData.absolute[i]);
    }

    testComponent.updateInteractions({
      raw: [],
      normalized: [],
      absolute: []
    });

    expect(testComponent.interactions.raw).toHaveLength(0);
    expect(testComponent.interactions.absolute).toHaveLength(0);
    expect(testComponent.interactions.normalized).toHaveLength(0);
  });

  it('should update isProcessing', () => {
    expect(testComponent.isProcessing).toBe(false);

    testComponent.isProcessing = true;

    expect(testComponent.isProcessing).toBe(true);

    testComponent.updateInteractions(largeData);

    expect(testComponent.interactions.raw).toHaveLength(10);
    expect(testComponent.interactions.absolute).toHaveLength(10);
    expect(testComponent.interactions.normalized).toHaveLength(10);

    testComponent.isProcessing = false;

    expect(testComponent.interactions.raw).toHaveLength(0);
    expect(testComponent.interactions.absolute).toHaveLength(0);
    expect(testComponent.interactions.normalized).toHaveLength(0);
  });
});
