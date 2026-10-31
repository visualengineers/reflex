import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompleteInteractionData, Interaction } from '@reflex/shared-types';
import { InteractionsComponent } from './interactions.component';

export let component: InteractionsComponent;

export let fixture: ComponentFixture<InteractionsComponent>;

export const largeData: CompleteInteractionData = {
  raw: [],
  normalized: [],
  absolute: []
};

export const smallData = {
  raw: new Array<Interaction>(),
  normalized: new Array<Interaction>(),
  absolute: new Array<Interaction>()
};

function resetInteractionData(): void {
  largeData.raw.length = 0;
  largeData.normalized.length = 0;
  largeData.absolute.length = 0;
  for (let i = 0; i < 25; i++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const base: Interaction = {
      time: 1234567,
      confidence: i % 10,
      touchId: i,
      type: 1,
      position: { x: x, y: y, z: z, isFiltered: false, isValid: true },
      extremumDescription: {
        numFittingPoints: 10,
        percentageFittingPoints: 100,
        type: 1
      }
    };
    largeData.normalized.push(base);
    const raw = structuredClone(base);
    raw.position.x *= 10;
    raw.position.y *= 15;
    raw.position.z *= 5;
    largeData.raw.push(raw);

    const abs = structuredClone(base);
    abs.position.x *= 100;
    abs.position.y *= 150;
    abs.position.z *= 50;
    largeData.absolute.push(abs);
  }

  smallData.raw = largeData.raw.filter((elem, idx) => idx > 20);

  smallData.normalized = largeData.normalized.filter((elem, idx) => idx > 20);

  smallData.absolute = largeData.absolute.filter((elem, idx) => idx > 20);
}

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    resetInteractionData();
    fixture = TestBed.createComponent(InteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
}
