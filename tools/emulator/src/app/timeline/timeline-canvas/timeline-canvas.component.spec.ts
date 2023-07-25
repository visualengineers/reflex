import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineCanvasComponent } from './timeline-canvas.component';

describe('TimelineCanvasComponent', () => {
  let component: TimelineCanvasComponent;
  let fixture: ComponentFixture<TimelineCanvasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimelineCanvasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
