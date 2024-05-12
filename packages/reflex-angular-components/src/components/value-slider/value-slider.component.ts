import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, skipWhile } from 'rxjs/operators';

@Component({
  selector: 'app-value-slider',
  standalone: true,
  templateUrl: './value-slider.component.html',
  imports: [ FormsModule ]
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

  private readonly currentValue: BehaviorSubject<number> = new BehaviorSubject(0);
  private readonly debounce$: Observable<number>;
  private debounceUpdate?: Subscription;
  private unchanged = true;

  public constructor() {
    this.debounce$ = this.currentValue.pipe(
      // wait until first change...
      skipWhile(() => this.unchanged),
      debounceTime(100)
    );
  }

  public ngOnInit(): void {
    this.debounceUpdate = this.debounce$.subscribe(
      () => this.onChange.emit(),
      (error) => console.error(error)
    );
  }

  public ngOnDestroy(): void {
    this.debounceUpdate?.unsubscribe();
    this.unchanged = true;
  }

  public update(value: number): void {
    this.unchanged = false;
    this.data = value;
    this.currentValue.next(this.data);
    this.dataChange.emit(this.data);
  }
}
