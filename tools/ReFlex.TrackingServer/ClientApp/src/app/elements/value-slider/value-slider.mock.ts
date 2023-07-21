import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ValueSliderComponent } from './value-slider.component';

@Component({ selector: 'app-value-slider',  template: '' })
export class MockValueSliderComponent implements Partial<ValueSliderComponent> {
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
}
