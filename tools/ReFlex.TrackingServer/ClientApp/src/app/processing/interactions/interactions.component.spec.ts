import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InteractionsComponent } from './interactions.component';
import { DatePipe } from '@angular/common';
import { CompleteInteractionData } from 'src/shared/interactions/complete-interaction.data';
import { Interaction } from 'src/shared/processing/interaction';

describe('InteractionsComponent', () => {
  let component: InteractionsComponent;
  let fixture: ComponentFixture<InteractionsComponent>;

  const largeData: CompleteInteractionData = {
    raw: [],
    normalized: [],
    absolute: []
  };

  for (var i = 0; i < 25; i++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    let base: Interaction =
      { time: 1234567, confidence: i%10, touchId: i, type: 1,
        position: { x: x, y: y, z: z, isFiltered: false, isValid: true }, 
        extremumDescription:{ numFittingPoints: 10, percentageFittingPoints: 100, type: 1 } 
      }
    largeData.normalized.push(base);
    let raw = structuredClone(base);
    raw.position.x *= 10
    raw.position.y *= 15
    raw.position.z *= 5;
    largeData.raw.push(raw);

    let abs = structuredClone(base);
    abs.position.x *= 100
    abs.position.y *= 150
    abs.position.z *= 50;
    largeData.absolute.push(abs);
  };

  const smallData = {
    raw: new Array<Interaction>(),
    normalized: new Array<Interaction>(),
    absolute: new Array<Interaction>()
  };

  smallData.raw = largeData.raw.filter((elem, idx) => idx > 20);
  smallData.normalized = largeData.normalized.filter((elem, idx) => idx > 20);
  smallData.absolute = largeData.absolute.filter((elem, idx) => idx > 20);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct timestamp', () => {
    const ticks = 638191569329269252;
    const expectedDate = new Date(Date.UTC(2023, 5, 8, 15, 35, 32, 926));

    const datepipe: DatePipe = new DatePipe('en-US', '+0000');
    let formattedDate = datepipe.transform(expectedDate, 'HH:mm:ss.SSS') as string;

    const converted = component.getTime(ticks);
    expect(converted).toEqual(formattedDate);
  });

  it('should update interactions', () => {
    component.updateInteractions(largeData);

    expect(component.interactions.raw).toHaveSize(10);
    expect(component.interactions.absolute).toHaveSize(10);
    expect(component.interactions.normalized).toHaveSize(10);

    for(var i = 10; i < 10; i++) {
      expect(component.interactions.raw[i]).toEqual(largeData.raw[i]);
      expect(component.interactions.normalized[i]).toEqual(largeData.normalized[i]);
      expect(component.interactions.absolute[i]).toEqual(largeData.absolute[i]);
    }

    component.updateInteractions(smallData);

    expect(component.interactions.raw).toHaveSize(4);
    expect(component.interactions.absolute).toHaveSize(4);
    expect(component.interactions.normalized).toHaveSize(4);    

    for(var i = 10; i < 4; i++) {
      expect(component.interactions.raw[i]).toEqual(smallData.raw[i]);
      expect(component.interactions.normalized[i]).toEqual(smallData.normalized[i]);
      expect(component.interactions.absolute[i]).toEqual(smallData.absolute[i]);
    }

    component.updateInteractions({
      raw: [],
      normalized: [],
      absolute: []
    });

    expect(component.interactions.raw).toHaveSize(0);
    expect(component.interactions.absolute).toHaveSize(0);
    expect(component.interactions.normalized).toHaveSize(0);
  });

  it('should update isProcessing', () => {
    expect(component.isProcessing).toBeFalse();

    component.isProcessing = true;

    expect(component.isProcessing).toBeTrue();

    component.updateInteractions(largeData);

    expect(component.interactions.raw).toHaveSize(10);
    expect(component.interactions.absolute).toHaveSize(10);
    expect(component.interactions.normalized).toHaveSize(10);

    component.isProcessing = false;

    expect(component.interactions.raw).toHaveSize(0);
    expect(component.interactions.absolute).toHaveSize(0);
    expect(component.interactions.normalized).toHaveSize(0);

  
  })
});
