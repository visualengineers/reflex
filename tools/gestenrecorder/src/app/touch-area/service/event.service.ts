import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  getMouseEvents(element: HTMLElement): { mouseDown$: Observable<MouseEvent>, mouseMove$: Observable<MouseEvent>, mouseOut$: Observable<MouseEvent>, mouseUp$: Observable<MouseEvent>, mouseWheel$: Observable<WheelEvent> } {
    return {
      mouseDown$: fromEvent<MouseEvent>(element, 'mousedown'),
      mouseMove$: fromEvent<MouseEvent>(element, 'mousemove'),
      mouseOut$: fromEvent<MouseEvent>(element, 'mouseout'),
      mouseUp$: fromEvent<MouseEvent>(element, 'mouseup'),
      mouseWheel$: fromEvent<WheelEvent>(element, 'wheel'),
    };
  }
}
