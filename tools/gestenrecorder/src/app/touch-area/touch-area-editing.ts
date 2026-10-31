import { take } from 'rxjs';
import { Gesture } from '../data/gesture';
import { NormalizedPoint } from '../model/NormalizedPoint.model';
import { ConfigurationService } from '../service/configuration.service';
import { GestureDataService } from '../service/gesture-data.service';
import { TouchAreaService } from './service/touch-area.service';

interface EditingServices {
  configuration: ConfigurationService; gestures: GestureDataService; touchArea: TouchAreaService; redraw: () => void;
}

export function updateGesturePoint(updatedPoint: NormalizedPoint, services: EditingServices): void {
  services.configuration
    .getNormalizedPoints()
    .pipe(take(1))
    .subscribe((currentPoints: Array<NormalizedPoint>) => {
      const index = currentPoints.findIndex(
        (p: NormalizedPoint) => p.index === updatedPoint.index
      );
      if (index !== -1) {
        currentPoints[index] = updatedPoint;
        services.configuration.setNormalizedPoints(currentPoints);

        // Convert NormalizedPoint to TouchPoint
        const touchPoint
            = services.touchArea.touchPointFromNormalizedPoint(updatedPoint);

        // Update the point in the GestureService
        services.gestures.gesture$
          .pipe(take(1))
          .subscribe((currentGesture: Gesture) => {
            if (
              currentGesture.tracks.length > 0
            ) {
              const frame = currentGesture.tracks[0].frames[index];
              if (frame !== undefined) {
                frame.x = touchPoint.position.x;
                frame.y = touchPoint.position.y;
                frame.z = touchPoint.position.z;
                services.gestures.updateGestureTrackFrame(
                  index,
                  frame.x,
                  frame.y,
                  frame.z
                );
              }
            }
          });

        // Redraw the points
        services.redraw();
      }
    });
}
