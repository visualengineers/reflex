import { component, fixture, setupTests } from './interactions-visualization.component.test-context';
import { customFrame, logService, testInteractionData } from './interactions-visualization.component.test-data';

describe('InteractionsVisualizationComponent', () => {
  setupTests();

  it('should correctly apply style', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBe(false);

    const expected1 = {
      position: 'relative',
      top: '0',
      left: '0',
      width: '100%',
      height: '40vh'
    };
    const expected2 = {
      position: 'absolute',
      top: `${customFrame.top}px`,
      left: `${customFrame.left}px`,
      width: `${customFrame.width}px`,
      height: `${customFrame.height}px`
    };

    const style1 = component.getInteractionsViewStyle();

    expect(style1).toEqual(expected1);

    component.fullScreen = true;

    const style2 = component.getInteractionsViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should return correct class based on extremum type', () => {
    const exp0 = 'interaction-minimum';
    const exp1 = 'interaction-maximum';
    const exp2 = 'interaction-undefined';

    const class0 = component.getClass(
      testInteractionData.raw[0].extremumDescription
    );
    const class1 = component.getClass(
      testInteractionData.raw[1].extremumDescription
    );
    const class2 = component.getClass(
      testInteractionData.raw[2].extremumDescription
    );

    expect(class0).toEqual(exp0);
    expect(class1).toEqual(exp1);
    expect(class2).toEqual(exp2);
  });
});
