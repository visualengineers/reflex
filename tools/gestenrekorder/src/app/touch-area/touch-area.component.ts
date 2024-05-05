import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { combineLatest, fromEvent, Subscription, race} from 'rxjs';
import { distinctUntilChanged, map, filter, publishBehavior, refCount, switchMap, takeUntil, debounceTime, withLatestFrom, startWith, pairwise } from 'rxjs/operators';
import { environment } from '../../../src/environments/environment';
import { ExtremumType, Interaction } from '@reflex/shared-types';
interface Size {
  width: number;
  height: number;
}

@Component({
  selector: 'app-touch-area',
  standalone: true,
  imports: [],
  templateUrl: './touch-area.component.html',
  styleUrl: './touch-area.component.scss'
})
export class TouchAreaComponent implements OnInit, OnDestroy {

  ngOnInit():void {
    
  }
  
  ngOnDestroy() {
    
  }
}
