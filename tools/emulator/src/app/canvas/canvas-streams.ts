import { Observable, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, publishBehavior, refCount } from 'rxjs/operators';

interface CanvasSize {
  width: number; height: number;
}

export function windowSizeChanges(): Observable<CanvasSize> {
  return fromEvent(window, 'resize').pipe(
    map(
      () => ({ width: window.innerWidth, height: window.innerHeight })
    ),
    // only react to actual changed values and wait for a stable value (debounce)
    distinctUntilChanged(
      (a, b) => a.width === b.width && a.height === b.height
    ),
    debounceTime(100),
    // window size used by multiple observers, by making it a 'hot' observable we keep the most recent value in a buffer
    publishBehavior({
      width: window.innerWidth,
      height: window.innerHeight
    }),
    refCount()
  );
}

export function canvasMouseEvents(canvas: HTMLCanvasElement): { contextMenu$: Observable<MouseEvent>; mouseDown$: Observable<MouseEvent>; mouseMove$: Observable<MouseEvent>; mouseOut$: Observable<MouseEvent>; mouseUp$: Observable<MouseEvent>; mouseWheel$: Observable<WheelEvent> } {
  return {
    contextMenu$: fromEvent<MouseEvent>(canvas, 'contextmenu'),
    mouseDown$: fromEvent<MouseEvent>(canvas, 'mousedown'),
    mouseMove$: fromEvent<MouseEvent>(canvas, 'mousemove'),
    mouseOut$: fromEvent<MouseEvent>(canvas, 'mouseout'),
    mouseUp$: fromEvent<MouseEvent>(canvas, 'mouseup'),
    mouseWheel$: fromEvent<WheelEvent>(canvas, 'wheel')
  };
}
