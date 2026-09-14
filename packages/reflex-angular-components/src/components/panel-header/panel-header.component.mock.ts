import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PanelHeaderComponent } from './panel-header.component';

@Component({
    selector: 'app-panel-header', template: ''
})
export class MockPanelHeaderComponent implements Partial<PanelHeaderComponent> {

@Input()
public disabled = false;

@Input()
public data = false;

@Output()
public dataChange = new EventEmitter<boolean>();

@Input()
public elementId = 'custom-header';

@Input()
public elementTitle = 'Custom Title';

@Output()
public onChange = new EventEmitter();
}
