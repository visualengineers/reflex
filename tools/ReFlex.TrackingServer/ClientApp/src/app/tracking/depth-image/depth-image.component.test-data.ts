import { DepthCameraState, TrackingConfigState } from '@reflex/shared-types';
import { of, Subject } from 'rxjs';
import { WebSocketServiceMock } from 'src/shared/services/webSocket.service.mock';

export const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus'),
  setDepthImagePreviewState: vi
    .fn()
    .mockName('fakeTrackingService.setDepthImagePreviewState')
};

export const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming]
};

trackingService.getStatus.mockReturnValue(of(state));

trackingService.setDepthImagePreviewState.mockReturnValue(of(true));

export const subject = new Subject<MessageEvent>();

export const wsMock = new WebSocketServiceMock(subject, 'mockedMessage');
