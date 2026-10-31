import { component, largeData, setupTests, smallData } from './interactions.component.test-context';

describe('InteractionsComponent', () => {
  setupTests();

  it('should update interactions', () => {
    component.updateInteractions(largeData);

    expect(component.interactions.raw).toHaveLength(10);
    expect(component.interactions.absolute).toHaveLength(10);
    expect(component.interactions.normalized).toHaveLength(10);

    for (let i = 0; i < 10; i++) {
      expect(component.interactions.raw[i]).toEqual(largeData.raw[i]);
      expect(component.interactions.normalized[i]).toEqual(
        largeData.normalized[i]
      );
      expect(component.interactions.absolute[i]).toEqual(largeData.absolute[i]);
    }

    component.updateInteractions(smallData);

    expect(component.interactions.raw).toHaveLength(4);
    expect(component.interactions.absolute).toHaveLength(4);
    expect(component.interactions.normalized).toHaveLength(4);

    for (let i = 0; i < 4; i++) {
      expect(component.interactions.raw[i]).toEqual(smallData.raw[i]);
      expect(component.interactions.normalized[i]).toEqual(
        smallData.normalized[i]
      );
      expect(component.interactions.absolute[i]).toEqual(smallData.absolute[i]);
    }

    component.updateInteractions({
      raw: [],
      normalized: [],
      absolute: []
    });

    expect(component.interactions.raw).toHaveLength(0);
    expect(component.interactions.absolute).toHaveLength(0);
    expect(component.interactions.normalized).toHaveLength(0);
  });

  it('should update isProcessing', () => {
    expect(component.isProcessing).toBe(false);

    component.isProcessing = true;

    expect(component.isProcessing).toBe(true);

    component.updateInteractions(largeData);

    expect(component.interactions.raw).toHaveLength(10);
    expect(component.interactions.absolute).toHaveLength(10);
    expect(component.interactions.normalized).toHaveLength(10);

    component.isProcessing = false;

    expect(component.interactions.raw).toHaveLength(0);
    expect(component.interactions.absolute).toHaveLength(0);
    expect(component.interactions.normalized).toHaveLength(0);
  });
});
