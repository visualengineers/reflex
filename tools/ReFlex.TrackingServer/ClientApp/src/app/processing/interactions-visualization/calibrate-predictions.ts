import { ExtremumType, Interaction, InteractionType, InteractionVelocity } from '@reflex/shared-types';
import { Observable, map, of } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';

const positionKeys = [
  'measuredPosition',
  'smoothedPosition',
  'matchingPosition',
  'predictedPositionBasic',
  'predictedPositionAdvanced'
] as const;

/** Calibrate all displayed positions together, retaining sensor values in the source snapshots. */
export function calibratePredictions(data: Array<InteractionVelocity>, service: CalibrationService): Observable<Array<InteractionVelocity>> {
  if (!data.length) {
    return of([]);
  }
  const positions: Array<Interaction> = data.flatMap((item) => positionKeys.map((key) => ({
    touchId: item.touchId,
    position: { ...item[key] },
    confidence: item.confidence,
    time: item.timestampSeconds,
    type: InteractionType.None,
    extremumDescription: { type: ExtremumType.Undefined, numFittingPoints: 0, percentageFittingPoints: 0 }
  })));

  return service.computeCalibratedPosition(positions).pipe(map((response) => {
    if (!response.ok || response.body?.length !== positions.length) {
      throw new Error('Could not calibrate prediction positions.');
    }
    const calibrated = response.body;

    return data.map((item, index) => {
      const result = { ...item };
      positionKeys.forEach((key, offset) => {
        result[key] = { ...calibrated[(index * positionKeys.length) + offset].position };
      });

      return result;
    });
  }));
}
