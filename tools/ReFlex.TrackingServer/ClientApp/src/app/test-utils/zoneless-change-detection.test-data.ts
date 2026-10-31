import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CompleteInteractionData,
  DepthCameraState,
  FrameSizeDefinition,
  Interaction,
  TrackingConfigState
} from '@reflex/shared-types';
import { NEVER } from 'rxjs';
import type { Mock, MockedObject } from 'vitest';

export function mockService<T>(type: Type<T>): MockedObject<T> {
  const methods = new Set<string>();
  let prototype: object | null = type.prototype as object;
  while (prototype !== null && prototype !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (
        name !== 'constructor'
        && typeof Object.getOwnPropertyDescriptor(prototype, name)?.value
          === 'function'
      ) {
        methods.add(name);
      }
    }
    prototype = Object.getPrototypeOf(prototype) as object | null;
  }
  const mock = Object.fromEntries([...methods].map((name) => [name, vi.fn()])) as MockedObject<T>;
  for (const method of methods) {
    (mock[method as keyof T] as Mock).mockReturnValue(NEVER);
  }
  TestBed.overrideProvider(type, { useValue: mock });

  return mock;
}

export const streaming: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'Test camera',
  selectedConfigurationName: 'Test configuration',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming]
};

export const frame: FrameSizeDefinition = {
  top: 17,
  left: 23,
  width: 640,
  height: 480
};

export const interaction: Interaction = {
  touchId: 42,
  confidence: 10,
  time: 638000000000000000,
  type: 0,
  extremumDescription: {
    type: 0,
    numFittingPoints: 10,
    percentageFittingPoints: 100
  },
  position: { x: 0.25, y: 0.5, z: 0.1, isFiltered: false, isValid: true }
};

export const interactionData = (): CompleteInteractionData => ({
  raw: [structuredClone(interaction)],
  normalized: [structuredClone(interaction)],
  absolute: [structuredClone(interaction)]
});
