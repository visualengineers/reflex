import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackComponentComponent } from './track-component.component';

describe('TrackComponentComponent', () => {
  let component: TrackComponentComponent;
  let fixture: ComponentFixture<TrackComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrackComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
