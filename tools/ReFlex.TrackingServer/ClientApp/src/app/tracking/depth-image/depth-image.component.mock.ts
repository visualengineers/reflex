import { Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { DepthImageComponent } from './depth-image.component';

@Component({
    selector: 'app-depth-image', template: ''
})
export class MockDepthImageComponent implements Partial<DepthImageComponent> {
  @Output()
  public fullScreenChanged = new EventEmitter<boolean>();

  @Input()
  public set livePreviewEnabled(value: boolean) { }
}
