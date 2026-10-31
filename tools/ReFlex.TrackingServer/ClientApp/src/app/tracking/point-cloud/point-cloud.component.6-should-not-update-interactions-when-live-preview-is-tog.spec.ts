import {
  Interaction
} from '@reflex/shared-types';
import { BehaviorSubject } from 'rxjs';
import { component, fixture, setupTests } from './point-cloud.component.test-context';
import { logService, processingService } from './point-cloud.component.test-data';


function verifyStage1(obs: BehaviorSubject<Array<Interaction>>): void {
  processingService.getInteractions.mockReturnValue(obs);
  component.livePreview = true;
  component.livePreviewChanged();
  fixture.detectChanges();
  expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
  obs.next([
    {
      touchId: 0,
      position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 10,
      time: 123456
    },
    {
      touchId: 1,
      position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 0,
      time: 656565989
    }
  ]);
  expect(component.numFramesReceived).toBe(0);
  expect(component['interactions']).toBeDefined();
  expect(component['interactions']).toHaveLength(2);
  component.livePreview = false;
}

function verifyStage2(obs: BehaviorSubject<Array<Interaction>>): void {
  component.livePreviewChanged();
  expect(component['interactions']).toBeDefined();
  expect(component['interactions']).toHaveLength(0);
  obs.next([
    {
      touchId: 0,
      position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 10,
      time: 123456
    }
  ]);
  expect(component['interactions']).toBeDefined();
  expect(component['interactions']).toHaveLength(0);
  component.livePreview = true;
  component.livePreviewChanged();
}

function verifyStage3(obs: BehaviorSubject<Array<Interaction>>): void {
  obs.next([
    {
      touchId: 0,
      position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 10,
      time: 123456
    },
    {
      touchId: 1,
      position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 0,
      time: 656565989
    },
    {
      touchId: 2,
      position: { x: 7, y: 8, z: 9, isValid: true, isFiltered: false },
      type: 1,
      extremumDescription: {
        type: 1,
        numFittingPoints: 10,
        percentageFittingPoints: 1
      },
      confidence: 15,
      time: 3542523542
    }
  ]);
  expect(component['interactions']).toBeDefined();
  expect(component['interactions']).toHaveLength(3);
  expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
}

function verifyScenario4(): void {
  const obs = new BehaviorSubject(new Array<Interaction>());

  verifyStage1(obs);

  verifyStage2(obs);

  verifyStage3(obs);

  expect(logService.sendErrorLog).not.toHaveBeenCalled();
}


describe('PointCloudComponent', () => {
  setupTests();

  it('should not update interactions when live preview is toggled off', verifyScenario4);
});
