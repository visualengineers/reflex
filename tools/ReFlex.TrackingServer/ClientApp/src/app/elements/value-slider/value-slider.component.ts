import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, skipWhile } from 'rxjs/operators';

@Component({
  selector: 'app-value-slider',
  templateUrl: './value-slider.component.html'
})
export class ValueSliderComponent implements OnInit, OnDestroy {
  @Input()
  public data = 0;

  @Output()
  public dataChange = new EventEmitter<number>();

  @Input()
  public min = 0;

  @Input()
  public max = 10;

  @Input()
  public step = 1;

  @Input()
  public unit = '';

  @Input()
  public elementId = 'customSlider';

  @Input()
  public elementTitle = 'Custom Value';

  @Output()
  public onChange = new EventEmitter();

  private readonly _currentValue: BehaviorSubject<number> = new BehaviorSubject(0);
  private readonly _debounce$: Observable<number>;
  private _debounceUpdate?: Subscription;
  private _unchanged = true;

  public constructor() {
    this._debounce$ = this._currentValue.pipe(
      // wait until first change...
      skipWhile(() => this._unchanged),
      debounceTime(100)
    );
  }

  public ngOnInit(): void {
    this._debounceUpdate = this._debounce$.subscribe(
      () => this.onChange.emit(),
      (error) => console.error(error)
    );
  }

  public ngOnDestroy(): void {
    this._debounceUpdate?.unsubscribe();
    this._unchanged = true;
  }

  public update(): void {
    this._unchanged = false;
    this._currentValue.next(this.data);
    this.dataChange.emit(this.data);
  }
}
