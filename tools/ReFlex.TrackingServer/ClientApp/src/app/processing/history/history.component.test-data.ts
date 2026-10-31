import {
  Interaction,
  InteractionFrame,
  InteractionHistory,
  InteractionHistoryElement
} from '@reflex/shared-types';

export const processingService = {
  getStatus: vi.fn().mockName('fakeProcessingCloudService.getStatus'),
  getFrames: vi.fn().mockName('fakeProcessingCloudService.getFrames'),
  getHistory: vi.fn().mockName('fakeProcessingCloudService.getHistory')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const frames = new Array<InteractionFrame>();

export const history = new Array<InteractionHistory>();

for (let i = 0; i < 16; i++) {
  const f: InteractionFrame = {
    frameId: 0,
    interactions: []
  };

  for (let j = 0; j < 5; j++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const base: Interaction = {
      time: 1234567,
      confidence: i,
      touchId: j,
      type: 1,
      position: { x: x, y: y, z: z, isFiltered: false, isValid: true },
      extremumDescription: {
        numFittingPoints: 10,
        percentageFittingPoints: 100,
        type: 1
      }
    };
    f.interactions.push(base);
  }
  frames.push(f);
}

for (let i = 0; i < 4; i++) {
  const h: InteractionHistory = {
    touchId: i,
    items: []
  };

  for (let j = 0; j < 20; j++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const base: Interaction = {
      time: 1234567,
      confidence: j,
      touchId: i,
      type: 1,
      position: { x: x, y: y, z: z, isFiltered: false, isValid: true },
      extremumDescription: {
        numFittingPoints: 10,
        percentageFittingPoints: 100,
        type: 1
      }
    };

    const e: InteractionHistoryElement = {
      frameId: 0,
      interaction: base
    };
    h.items.push(e);
  }

  history.push(h);
}
