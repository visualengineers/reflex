import { ExtremumType, Interaction, InteractionType, InteractionVelocity, Point3 } from '@reflex/shared-types';
import { Observable, map, of } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';

const positionKeys = [
  'measuredPosition',
  'smoothedPosition',
  'matchingPosition',
  'predictedPositionBasic',
  'predictedPositionAdvanced'
] as const;

/** 95% joint XY Gaussian contour: sqrt(chi-square(2, .95)), not a per-axis 1.96-sigma interval. */
export function kalmanContour(item: InteractionVelocity): Array<Point3> {
  const center = item.kalmanPosition;
  const x = item.kalmanVarianceX;
  const y = item.kalmanVarianceY;
  if (item.useKalmanFilter !== true || !center || x == null || y == null
    || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
    return [];
  }
  const radiusX = Math.sqrt(5.991464547 * x);
  const radiusY = Math.sqrt(5.991464547 * y);

  return Array.from({ length: 32 }, (value, index) => {
    const angle = index * 2 * Math.PI / 32;

    return { ...center, x: center.x + (radiusX * Math.cos(angle)), y: center.y + (radiusY * Math.sin(angle)) };
  });
}

/** Transform contour vertices together with all positions. This also handles rotated/perspective
 * calibration without pretending that raw sensor variances are calibrated screen-axis variances. */
export function calibratePredictions(data: Array<InteractionVelocity>, service: CalibrationService): Observable<Array<InteractionVelocity>> {
  if (!data.length) {
    return of([]);
  }
  const groups = data.map((item) => ({
    item,
    points: [
      ...positionKeys.map((key) => item[key]),
      ...item.useKalmanFilter === true && item.kalmanPosition != null ? [item.kalmanPosition, ...kalmanContour(item)] : []
    ]
  }));
  const positions: Array<Interaction> = groups.flatMap(({ item, points }) => points.map((point) => ({
    touchId: item.touchId,
    position: { ...point },
    confidence: item.confidence,
    time: item.timestampSeconds,
    type: InteractionType.None,
    extremumDescription: { type: ExtremumType.Undefined, numFittingPoints: 0, percentageFittingPoints: 0 }
  })));

  return service.computeCalibratedPosition(positions).pipe(map((response) => {
    if (!response.ok || response.body?.length !== positions.length) {
      throw new Error('Could not calibrate diagnostic positions.');
    }
    const calibrated = response.body;
    let offset = 0;

    return groups.map(({ item, points }) => {
      const result = { ...item, kalmanUncertainty: [] as Array<Point3> };
      positionKeys.forEach((key, index) => {
        result[key] = { ...calibrated[offset + index].position };
      });
      if (points.length > positionKeys.length) {
        result.kalmanPosition = { ...calibrated[offset + positionKeys.length].position };
        result.kalmanUncertainty = calibrated.slice(offset + positionKeys.length + 1, offset + points.length)
          .map((value) => ({ ...value.position }));
      }
      offset += points.length;

      return result;
    });
  }));
}
