import { Observable, filter, map } from 'rxjs';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { Layers } from '../service/configuration.service';
import { CircleDto, CircleRenderer } from '../shapes/Circle';
import { TouchAreaService } from './service/touch-area.service';

export function renderTouchArea(context: CanvasRenderingContext2D | undefined, renderer: CircleRenderer | undefined, points: Array<CircleDto>, animated: CircleDto | undefined): void {
  if (context === undefined) {
    return;
  }
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.globalAlpha = 0.5;

  // Draw stored circles
  points.forEach((circleDto, index) => {
    renderer?.draw(circleDto);

    // Zeichne den Index in die Mitte des Kreises
    if (context !== undefined) {
      context.globalAlpha = 1; // Text sollte vollständig sichtbar sein
      context.font = '16px Arial'; // Schriftart und Größe
      context.fillStyle = 'white'; // Textfarbe
      context.textAlign = 'center'; // Text zentriert horizontal
      context.textBaseline = 'middle'; // Text zentriert vertikal

      // Position des Textes (Mittelpunkt des Kreises)
      const textX = circleDto.posX;
      const textY = circleDto.posY;

      // Zeichne den Text
      context.fillText(index.toString(), textX, textY);
    }

    // Zeichne gestrichelte Linie zum nächsten Punkt
    if (context !== undefined) {
      if (index < points.length - 1) {
        const nextCircleDto = points[index + 1];
        context.globalAlpha = 1; // Linie sollte vollständig sichtbar sein
        context.strokeStyle = 'white'; // Linienfarbe
        context.lineWidth = 2; // Linienbreite
        context.setLineDash([5, 5]); // Strichmuster: [Strichlänge, Lückenlänge]

        context.beginPath();
        context.moveTo(circleDto.posX, circleDto.posY);
        context.lineTo(nextCircleDto.posX, nextCircleDto.posY);
        context.stroke();
        context.setLineDash([]); // Setzt das Strichmuster zurück
      }
    }
  });

  // Draw the animated circle
  if (animated) {
    renderer?.draw(animated);
  }
}

export function playbackCircles(frames: Observable<GestureTrackFrame | null>, canvas: HTMLCanvasElement | undefined, layers: () => Layers | undefined, service: TouchAreaService): Observable<CircleDto> {
  return frames.pipe(
    filter((frame): frame is GestureTrackFrame => frame !== null),
    map((frame) => service.circleDtoFromNormalizedPoint(
      { index: 0, x: frame.x, y: frame.y, z: frame.z, time: 0 },
      { width: canvas?.width ?? 0, height: canvas?.height ?? 0 },
      layers()
    ))
  );
}
