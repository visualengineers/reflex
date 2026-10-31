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
    distinctUntilChanged(
      (a, b) => a.width === b.width && a.height === b.height
    ),
    debounceTime(100),
    publishBehavior({
      width: window.innerWidth,
      height: window.innerHeight
    }),
    refCount()
  );
}
