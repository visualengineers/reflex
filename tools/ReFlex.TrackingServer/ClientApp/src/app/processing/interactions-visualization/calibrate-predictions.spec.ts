import { kalmanContour } from './calibrate-predictions';
import { predictionSnapshot } from '../interactions-velocity-visualization/interactions-velocity-visualization.component.test-data';

describe('Kalman uncertainty contour', () => {
  it('uses the joint 95% position region and rejects unavailable or invalid covariance', () => {
    const base = { ...predictionSnapshot(), useKalmanFilter: true, kalmanPosition: predictionSnapshot().smoothedPosition };
    expect(kalmanContour({ ...base, kalmanVarianceX: 4, kalmanVarianceY: 9 })).toHaveLength(32);
    for (const variance of [undefined, null, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(kalmanContour({ ...base, kalmanVarianceX: variance, kalmanVarianceY: 4 })).toEqual([]);
    }
    expect(kalmanContour({ ...base, useKalmanFilter: false, kalmanVarianceX: 4, kalmanVarianceY: 4 })).toEqual([]);
  });
});
